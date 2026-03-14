import { Q } from "@nozbe/watermelondb"
import type { Observable } from "@nozbe/watermelondb/utils/rx"
import { startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns"
import { from } from "rxjs"
import { map, switchMap } from "rxjs/operators"

import type {
  AddBudgetFormSchema,
  UpdateBudgetFormSchema,
} from "~/schemas/budgets.schema"
import type { Budget } from "~/types/budgets"
import { BudgetPeriodEnum } from "~/types/budgets"

import { database } from "../index"
import type BudgetModel from "../models/budget"
import type BudgetAccountModel from "../models/budget-account"
import type BudgetCategoryModel from "../models/budget-category"
import type TransactionModel from "../models/transaction"
import { modelToBudget } from "../utils/model-to-budget"

/**
 * Budget Service
 *
 * Provides functions for managing budget data.
 * Follows WatermelonDB CRUD pattern: https://watermelondb.dev/docs/CRUD
 *
 * Budgets use a join table (budget_accounts) so accountIds are fetched
 * separately and merged at mapping time.
 */

const getBudgetCollection = () => database.get<BudgetModel>("budgets")

const getBudgetAccountCollection = () =>
  database.get<BudgetAccountModel>("budget_accounts")

const getTransactionCollection = () =>
  database.get<TransactionModel>("transactions")

/**
 * Fetch the account IDs associated with a budget from the join table.
 */
export const getAccountIdsForBudget = async (
  budgetId: string,
): Promise<string[]> => {
  const rows = await getBudgetAccountCollection()
    .query(Q.where("budget_id", budgetId))
    .fetch()
  return rows.map((r) => r.accountId)
}

/**
 * Observe account IDs for a budget reactively (for withObservables).
 */
export const observeAccountIdsForBudget = (
  budgetId: string,
): Observable<string[]> =>
  getBudgetAccountCollection()
    .query(Q.where("budget_id", budgetId))
    .observe()
    .pipe(map((rows) => rows.map((r) => r.accountId)))

/**
 * Observe category IDs for a budget reactively (for withObservables).
 */
export const observeCategoryIdsForBudget = (
  budgetId: string,
): Observable<string[]> =>
  getBudgetCategoryCollection()
    .query(Q.where("budget_id", budgetId))
    .observe()
    .pipe(map((rows) => rows.map((r) => r.categoryId)))

/**
 * Observe all budgets, optionally including archived ones.
 *
 * Uses observeWithColumns so the list reacts to field changes, not just
 * record additions/deletions. Because accountIds live in a separate join
 * table, each emission fetches budget_account rows and groups them by
 * budget_id before mapping to plain Budget objects.
 */
export const observeBudgets = (): Observable<Budget[]> => {
  const query = getBudgetCollection().query(Q.sortBy("name", Q.asc))

  return query
    .observeWithColumns([
      "name",
      "amount",
      "currency_code",
      "period",
      "start_date",
      "end_date",
      "category_id",
      "alert_threshold",
      "is_active",
      "icon",
      "color_scheme_name",
    ])
    .pipe(
      switchMap((budgetModels) =>
        from(
          (async (): Promise<Budget[]> => {
            if (budgetModels.length === 0) return []

            const budgetIds = budgetModels.map((b) => b.id)

            // Fetch all budget_account join rows for these budgets in one query
            const allJoinRows = await getBudgetAccountCollection()
              .query(Q.where("budget_id", Q.oneOf(budgetIds)))
              .fetch()

            // Group accountIds by budget_id
            const accountIdsByBudget = new Map<string, string[]>()
            for (const row of allJoinRows) {
              const existing = accountIdsByBudget.get(row.budgetId) ?? []
              existing.push(row.accountId)
              accountIdsByBudget.set(row.budgetId, existing)
            }

            // Inside the switchMap, alongside the existing accountIds fetch:
            const categoryRows = await getBudgetCategoryCollection()
              .query(Q.where("budget_id", Q.oneOf(budgetIds)))
              .fetch()

            const categoriesByBudget = new Map<string, string[]>()
            for (const row of categoryRows) {
              const arr = categoriesByBudget.get(row.budgetId) ?? []
              arr.push(row.categoryId)
              categoriesByBudget.set(row.budgetId, arr)
            }

            // When calling modelToBudget, pass categoryIds:
            return budgetModels.map((m) =>
              modelToBudget(
                m,
                accountIdsByBudget.get(m.id) ?? [],
                categoriesByBudget.get(m.id) ?? [], // NEW
              ),
            )
          })(),
        ),
      ),
    )
}

/**
 * Observe a single budget model by ID (raw model, for edit screens).
 */
export const observeBudgetById = (id: string): Observable<BudgetModel> =>
  getBudgetCollection().findAndObserve(id)

/**
 * Find a budget by ID. Returns null if not found.
 */
export const findBudget = async (id: string): Promise<BudgetModel | null> => {
  try {
    return await getBudgetCollection().find(id)
  } catch {
    return null
  }
}

/**
 * Create a new budget and its account associations in a single write.
 */
export const createBudget = async (
  data: AddBudgetFormSchema,
): Promise<BudgetModel> => {
  return database.write(async () => {
    const budget = await getBudgetCollection().create((b) => {
      b.name = data.name
      b.amount = data.amount
      b.currencyCode = data.currencyCode
      b.period = data.period
      // WatermelonDB @date fields accept Date objects; schema stores as Unix ms
      b.startDate = new Date(data.startDate)
      b.endDate = data.endDate != null ? new Date(data.endDate) : null
      b.alertThreshold = data.alertThreshold ?? null
      b.isActive = data.isActive ?? true
      b.icon = data.icon ?? null
      b.setColorScheme(data.colorSchemeName ?? null)
      b.createdAt = new Date()
      b.updatedAt = new Date()
    })

    // Create one budget_account row per linked account
    for (const accountId of data.accountIds) {
      await getBudgetAccountCollection().create((ba) => {
        ba.budgetId = budget.id
        ba.accountId = accountId
        ba.createdAt = new Date()
      })
    }

    for (const categoryId of data.categoryIds) {
      await getBudgetCategoryCollection().create((bc) => {
        bc.budgetId = budget.id
        bc.categoryId = categoryId
        bc.createdAt = new Date()
      })
    }

    return budget
  })
}

/**
 * Update a budget's fields and, when accountIds changes, replace the join rows.
 */
export const updateBudget = async (
  budget: BudgetModel,
  updates: Partial<UpdateBudgetFormSchema>,
): Promise<BudgetModel> => {
  return database.write(async () => {
    const updated = await budget.update((b) => {
      if (updates.name !== undefined) b.name = updates.name
      if (updates.amount !== undefined) b.amount = updates.amount
      if (updates.currencyCode !== undefined)
        b.currencyCode = updates.currencyCode
      if (updates.period !== undefined) b.period = updates.period
      if (updates.startDate !== undefined)
        b.startDate = new Date(updates.startDate)
      if (updates.endDate !== undefined)
        b.endDate = updates.endDate != null ? new Date(updates.endDate) : null
      if (updates.alertThreshold !== undefined)
        b.alertThreshold = updates.alertThreshold ?? null
      if (updates.isActive !== undefined) b.isActive = updates.isActive
      if (updates.icon !== undefined) b.icon = updates.icon ?? null
      if (updates.colorSchemeName !== undefined)
        b.setColorScheme(updates.colorSchemeName ?? null)
      b.updatedAt = new Date()
    })

    if (updates.accountIds !== undefined) {
      // Replace all existing join rows with the new set
      const existing = await getBudgetAccountCollection()
        .query(Q.where("budget_id", budget.id))
        .fetch()
      for (const row of existing) {
        await row.destroyPermanently()
      }
      for (const accountId of updates.accountIds) {
        await getBudgetAccountCollection().create((ba) => {
          ba.budgetId = budget.id
          ba.accountId = accountId
          ba.createdAt = new Date()
        })
      }
    }

    if (updates.categoryIds !== undefined) {
      const existingCats = await getBudgetCategoryCollection()
        .query(Q.where("budget_id", budget.id))
        .fetch()
      for (const row of existingCats) {
        await row.destroyPermanently()
      }
      for (const categoryId of updates.categoryIds) {
        await getBudgetCategoryCollection().create((bc) => {
          bc.budgetId = budget.id
          bc.categoryId = categoryId
          bc.createdAt = new Date()
        })
      }
    }

    return updated
  })
}

/**
 * Permanently delete a budget and its join rows in a single write.
 */
export const destroyBudget = async (budget: BudgetModel): Promise<void> => {
  await database.write(async () => {
    const joinRows = await getBudgetAccountCollection()
      .query(Q.where("budget_id", budget.id))
      .fetch()
    for (const row of joinRows) {
      await row.destroyPermanently()
    }
    await budget.destroyPermanently()
  })
}

/**
 * Compute the total amount spent against a budget for the relevant period.
 *
 * Queries confirmed (non-pending, non-deleted) expense transactions that
 * belong to the linked accounts (and optionally a specific category) within
 * the period window derived from the budget's period type.
 *
 * Returns the sum of transaction amounts (always non-negative).
 */
export const computeBudgetSpent = async (
  //TODO: delete this if its not used at all
  budgetId: string,
  accountIds: string[],
  categoryIds: string[],
  period: string,
  startDate: number,
  endDate?: number | null,
): Promise<number> => {
  if (accountIds.length === 0) return 0

  const now = new Date()

  // Determine the period start boundary based on the budget's period type
  let periodStart: Date
  let periodEnd: Date = now

  switch (period) {
    case BudgetPeriodEnum.DAILY:
      periodStart = startOfDay(now)
      break
    case BudgetPeriodEnum.WEEKLY:
      periodStart = startOfWeek(now)
      break
    case BudgetPeriodEnum.MONTHLY:
      periodStart = startOfMonth(now)
      break
    case BudgetPeriodEnum.YEARLY:
      periodStart = startOfYear(now)
      break
    // TODO: finish this case
    // case BudgetPeriodEnum.CUSTOM:
    default:
      // Custom: use the provided startDate/endDate Unix timestamps
      periodStart = new Date(startDate)
      if (endDate != null) {
        periodEnd = new Date(endDate)
      }
      break
  }

  const periodStartTs = periodStart.getTime()
  const periodEndTs = periodEnd.getTime()

  // Build the query conditions
  const conditions = [
    Q.where("is_deleted", false),
    Q.where("is_pending", false),
    Q.where("type", "expense"),
    Q.where("is_transfer", false),
    Q.where("account_id", Q.oneOf(accountIds)),
    Q.where("transaction_date", Q.gte(periodStartTs)),
    Q.where("transaction_date", Q.lte(periodEndTs)),
  ]

  if (categoryIds.length > 0) {
    conditions.push(Q.where("category_id", Q.oneOf(categoryIds)))
  }

  const rows = await getTransactionCollection()
    .query(...conditions)
    .fetch()

  return rows.reduce((sum, t) => sum + t.amount, 0)
}

const getBudgetCategoryCollection = () =>
  database.get<BudgetCategoryModel>("budget_categories")

export const getCategoryIdsForBudget = async (
  budgetId: string,
): Promise<string[]> => {
  const rows = await getBudgetCategoryCollection()
    .query(Q.where("budget_id", budgetId))
    .fetch()
  return rows.map((r) => r.categoryId)
}

/**
 * Observe the total amount spent against a budget for the relevant period.
 */
export const observeBudgetSpent = (
  accountIds: string[],
  categoryIds: string[],
  period: string,
  startDate: number,
  endDate?: number | null,
): Observable<number> => {
  if (accountIds.length === 0) return from([0])

  const now = new Date()
  let periodStart: Date
  let periodEnd: Date = now

  switch (period) {
    case BudgetPeriodEnum.DAILY:
      periodStart = startOfDay(now)
      break
    case BudgetPeriodEnum.WEEKLY:
      periodStart = startOfWeek(now)
      break
    case BudgetPeriodEnum.MONTHLY:
      periodStart = startOfMonth(now)
      break
    case BudgetPeriodEnum.YEARLY:
      periodStart = startOfYear(now)
      break
    default:
      periodStart = new Date(startDate)
      if (endDate != null) {
        periodEnd = new Date(endDate)
      }
      break
  }

  const periodStartTs = periodStart.getTime()
  const periodEndTs = periodEnd.getTime()

  const conditions = [
    Q.where("is_deleted", false),
    Q.where("is_pending", false),
    Q.where("type", "expense"),
    Q.where("is_transfer", false),
    Q.where("account_id", Q.oneOf(accountIds)),
    Q.where("transaction_date", Q.gte(periodStartTs)),
    Q.where("transaction_date", Q.lte(periodEndTs)),
  ]

  if (categoryIds.length > 0) {
    conditions.push(Q.where("category_id", Q.oneOf(categoryIds)))
  }

  return getTransactionCollection()
    .query(...conditions)
    .observe()
    .pipe(map((rows) => rows.reduce((sum, t) => sum + t.amount, 0)))
}
