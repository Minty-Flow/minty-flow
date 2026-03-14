import { withObservables } from "@nozbe/watermelondb/react"
import { useLocalSearchParams } from "expo-router"

import { GoalModifyContent } from "~/components/goals/goal-modify/goal-modify-content"
import type GoalModel from "~/database/models/goal"
import { observeAccounts } from "~/database/services/account-service"
import {
  observeAccountIdsForGoal,
  observeGoalById,
} from "~/database/services/goal-service"
import { modelToGoal } from "~/database/utils/model-to-goal"
import type { Account } from "~/types/accounts"
import type { Goal } from "~/types/goals"
import { NewEnum } from "~/types/new"

// --- Edit mode: observes the goal model, accounts, and join-table account IDs ---
// All data is fully resolved before the component mounts, so useForm receives
// correct defaultValues on the very first render.

interface EnhancedEditProps {
  goalId: string
  goalModel: GoalModel
  accounts: Account[]
  accountIds: string[]
}

function EditGoalScreen({
  goalId,
  goalModel,
  accounts,
  accountIds,
}: EnhancedEditProps) {
  const goal: Goal = modelToGoal(goalModel, accountIds)

  return (
    <GoalModifyContent
      key={goal.id}
      goalModifyId={goalId}
      goal={goal}
      goalModel={goalModel}
      accounts={accounts}
    />
  )
}

const EnhancedEditScreen = withObservables(
  ["goalId"],
  ({ goalId }: { goalId: string }) => ({
    goalModel: observeGoalById(goalId),
    accounts: observeAccounts(),
    accountIds: observeAccountIdsForGoal(goalId),
  }),
)(EditGoalScreen)

// --- Add mode: only observes accounts (no goal model yet) ---

interface EnhancedAddProps {
  goalId: string
  accounts: Account[]
}

function AddGoalScreen({ goalId, accounts }: EnhancedAddProps) {
  return <GoalModifyContent goalModifyId={goalId} accounts={accounts} />
}

const EnhancedAddScreen = withObservables([], () => ({
  accounts: observeAccounts(),
}))(AddGoalScreen)

// --- Route entry point ---

export default function GoalModifyScreen() {
  const params = useLocalSearchParams<{ goalId: string }>()
  const goalId = params.goalId ?? NewEnum.NEW
  const isAddMode = goalId === NewEnum.NEW || !goalId

  if (isAddMode) {
    return <EnhancedAddScreen goalId={NewEnum.NEW} />
  }

  return <EnhancedEditScreen goalId={goalId} />
}
