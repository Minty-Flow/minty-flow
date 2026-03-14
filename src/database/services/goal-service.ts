import { Q } from "@nozbe/watermelondb"
import type { Observable } from "@nozbe/watermelondb/utils/rx"
import { combineLatest, of } from "rxjs"
import { map, switchMap } from "rxjs/operators"

import type {
  AddGoalFormSchema,
  UpdateGoalFormSchema,
} from "~/schemas/goals.schema"
import type { Goal } from "~/types/goals"

import { database } from "../index"
import type AccountModel from "../models/account"
import type GoalModel from "../models/goal"
import type GoalAccountModel from "../models/goal-account"
import { modelToGoal } from "../utils/model-to-goal"

/**
 * Goal Service
 *
 * Provides functions for managing goal data.
 * Follows WatermelonDB CRUD pattern: https://watermelondb.dev/docs/CRUD
 *
 * Goals use a join table (goal_accounts) so accountIds are fetched
 * separately and merged at mapping time. Progress is derived from
 * the sum of linked account balances at read time.
 */

const getGoalCollection = () => database.get<GoalModel>("goals")

const getGoalAccountCollection = () =>
  database.get<GoalAccountModel>("goal_accounts")

const getAccountCollection = () => database.get<AccountModel>("accounts")

/**
 * Fetch the account IDs associated with a goal from the join table.
 */
export const getAccountIdsForGoal = async (
  goalId: string,
): Promise<string[]> => {
  const rows = await getGoalAccountCollection()
    .query(Q.where("goal_id", goalId))
    .fetch()
  return rows.map((r) => r.accountId)
}

/**
 * Observe account IDs for a goal reactively (for withObservables).
 */
export const observeAccountIdsForGoal = (
  goalId: string,
): Observable<string[]> =>
  getGoalAccountCollection()
    .query(Q.where("goal_id", goalId))
    .observe()
    .pipe(map((rows) => rows.map((r) => r.accountId)))

/**
 * Observe all goals, optionally including archived ones.
 *
 * Uses observeWithColumns so the list reacts to field changes, not just
 * record additions/deletions. The goal_accounts join table is also observed
 * so that account link changes trigger list re-renders.
 */
export const observeGoals = (): Observable<Goal[]> => {
  const query = getGoalCollection().query(Q.sortBy("name", Q.asc))

  // Observe the join table so changes to linked accounts also trigger updates
  const joinRows$ = getGoalAccountCollection().query().observe()

  return query
    .observeWithColumns([
      "name",
      "description",
      "target_amount",
      "current_amount",
      "currency_code",
      "target_date",
      "icon",
      "color_scheme_name",
      "is_completed",
    ])
    .pipe(
      switchMap((goalModels) =>
        combineLatest([of(goalModels), joinRows$]).pipe(
          map(([latestGoalModels, allJoinRows]) => {
            if (latestGoalModels.length === 0) return []

            // Group accountIds by goal_id
            const accountIdsByGoal = new Map<string, string[]>()
            for (const row of allJoinRows) {
              const existing = accountIdsByGoal.get(row.goalId) ?? []
              existing.push(row.accountId)
              accountIdsByGoal.set(row.goalId, existing)
            }

            return latestGoalModels.map((model) =>
              modelToGoal(model, accountIdsByGoal.get(model.id) ?? []),
            )
          }),
        ),
      ),
    )
}

/**
 * Observe a single goal model by ID (raw model, for edit screens).
 */
export const observeGoalById = (id: string): Observable<GoalModel> =>
  getGoalCollection().findAndObserve(id)

/**
 * Find a goal by ID. Returns null if not found.
 */
export const findGoal = async (id: string): Promise<GoalModel | null> => {
  try {
    return await getGoalCollection().find(id)
  } catch {
    return null
  }
}

/**
 * Create a new goal and its account associations in a single write.
 */
export const createGoal = async (
  data: AddGoalFormSchema,
): Promise<GoalModel> => {
  return database.write(async () => {
    const goal = await getGoalCollection().create((g) => {
      g.name = data.name
      g.description = data.description ?? null
      g.targetAmount = data.targetAmount
      // currentAmount starts at 0; progress is computed from account balances
      g.currentAmount = 0
      g.currencyCode = data.currencyCode
      // WatermelonDB @date fields accept Date objects; schema stores as Unix ms
      g.targetDate = data.targetDate != null ? new Date(data.targetDate) : null
      g.icon = data.icon ?? null
      g.setColorScheme(data.colorSchemeName ?? null)
      g.isCompleted = data.isCompleted ?? false
      g.createdAt = new Date()
      g.updatedAt = new Date()
    })

    // Create one goal_account row per linked account
    for (const accountId of data.accountIds) {
      await getGoalAccountCollection().create((ga) => {
        ga.goalId = goal.id
        ga.accountId = accountId
        ga.createdAt = new Date()
      })
    }

    return goal
  })
}

/**
 * Update a goal's fields and, when accountIds changes, replace the join rows.
 */
export const updateGoal = async (
  goal: GoalModel,
  updates: Partial<UpdateGoalFormSchema>,
): Promise<GoalModel> => {
  return database.write(async () => {
    const updated = await goal.update((g) => {
      if (updates.name !== undefined) g.name = updates.name
      if (updates.description !== undefined)
        g.description = updates.description ?? null
      if (updates.targetAmount !== undefined)
        g.targetAmount = updates.targetAmount
      if (updates.currencyCode !== undefined)
        g.currencyCode = updates.currencyCode
      if (updates.targetDate !== undefined)
        g.targetDate =
          updates.targetDate != null ? new Date(updates.targetDate) : null
      if (updates.icon !== undefined) g.icon = updates.icon ?? null
      if (updates.colorSchemeName !== undefined)
        g.setColorScheme(updates.colorSchemeName ?? null)
      if (updates.isCompleted !== undefined) g.isCompleted = updates.isCompleted
      g.updatedAt = new Date()
    })

    if (updates.accountIds !== undefined) {
      // Replace all existing join rows with the new set
      const existing = await getGoalAccountCollection()
        .query(Q.where("goal_id", goal.id))
        .fetch()
      for (const row of existing) {
        await row.destroyPermanently()
      }
      for (const accountId of updates.accountIds) {
        await getGoalAccountCollection().create((ga) => {
          ga.goalId = goal.id
          ga.accountId = accountId
          ga.createdAt = new Date()
        })
      }
    }

    return updated
  })
}

/**
 * Permanently delete a goal and its join rows in a single write.
 */
export const destroyGoal = async (goal: GoalModel): Promise<void> => {
  await database.write(async () => {
    const joinRows = await getGoalAccountCollection()
      .query(Q.where("goal_id", goal.id))
      .fetch()
    for (const row of joinRows) {
      await row.destroyPermanently()
    }
    await goal.destroyPermanently()
  })
}

/**
 * Compute the current progress toward a goal by summing the balances of
 * all linked accounts. This is the "current amount" saved toward the goal.
 *
 * Returns 0 when no accounts are linked or accounts cannot be found.
 */
export const computeGoalProgress = async (
  accountIds: string[],
): Promise<number> => {
  if (accountIds.length === 0) return 0

  const accounts = await getAccountCollection()
    .query(Q.where("id", Q.oneOf(accountIds)))
    .fetch()

  return accounts.reduce((sum, account) => sum + account.balance, 0)
}

/**
 * Observe the current progress toward a goal reactively.
 * Sums the balances of all linked accounts and emits whenever any
 * account balance changes or the list of accounts changes.
 */
export const observeGoalProgress = (
  accountIds: string[],
): Observable<number> => {
  if (accountIds.length === 0) return of(0)

  return getAccountCollection()
    .query(Q.where("id", Q.oneOf(accountIds)))
    .observeWithColumns(["balance"])
    .pipe(
      map((accounts) =>
        accounts.reduce((sum, account) => sum + account.balance, 0),
      ),
    )
}
