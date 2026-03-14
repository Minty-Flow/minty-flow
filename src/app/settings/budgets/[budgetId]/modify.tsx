import { withObservables } from "@nozbe/watermelondb/react"
import { useLocalSearchParams } from "expo-router"

import { BudgetModifyContent } from "~/components/budgets/budget-modify/budget-modify-content"
import type BudgetModel from "~/database/models/budget"
import { observeAccounts } from "~/database/services/account-service"
import {
  observeAccountIdsForBudget,
  observeBudgetById,
  observeCategoryIdsForBudget,
} from "~/database/services/budget-service"
import { observeCategoriesByType } from "~/database/services/category-service"
import { modelToBudget } from "~/database/utils/model-to-budget"
import type { Account } from "~/types/accounts"
import type { Category } from "~/types/categories"
import { NewEnum } from "~/types/new"
import { TransactionTypeEnum } from "~/types/transactions"

// ---------------------------------------------------------------------------
// Add mode: only needs the accounts observable
// ---------------------------------------------------------------------------

interface AddScreenInnerProps {
  accounts: Account[]
  categories: Category[]
}

function AddScreenInner({ accounts, categories }: AddScreenInnerProps) {
  return (
    <BudgetModifyContent
      budgetModifyId={NewEnum.NEW}
      accounts={accounts}
      categories={categories}
    />
  )
}

const AddScreen = withObservables([], () => ({
  accounts: observeAccounts(),
  categories: observeCategoriesByType(TransactionTypeEnum.EXPENSE),
}))(AddScreenInner)

// ---------------------------------------------------------------------------
// Edit mode: observes the budget model + accounts + join-table IDs reactively.
// All data is fully resolved before the component mounts, so useForm receives
// correct defaultValues on the very first render.
// ---------------------------------------------------------------------------

interface EditScreenInnerProps {
  budgetId: string
  budgetModel: BudgetModel
  accounts: Account[]
  categories: Category[]
  accountIds: string[]
  categoryIds: string[]
}

function EditScreenInner({
  budgetId,
  budgetModel,
  accounts,
  categories,
  accountIds,
  categoryIds,
}: EditScreenInnerProps) {
  const budget = modelToBudget(budgetModel, accountIds, categoryIds)

  return (
    <BudgetModifyContent
      key={budget.id}
      budgetModifyId={budgetId}
      budget={budget}
      budgetModel={budgetModel}
      accounts={accounts}
      categories={categories}
    />
  )
}

const EnhancedEditScreen = withObservables(
  ["budgetId"],
  ({ budgetId }: { budgetId: string }) => ({
    budgetModel: observeBudgetById(budgetId),
    accounts: observeAccounts(),
    categories: observeCategoriesByType(TransactionTypeEnum.EXPENSE),
    accountIds: observeAccountIdsForBudget(budgetId),
    categoryIds: observeCategoryIdsForBudget(budgetId),
  }),
)(EditScreenInner)

// ---------------------------------------------------------------------------
// Route entry point — dispatches to add or edit mode
// ---------------------------------------------------------------------------

export default function ModifyBudgetScreen() {
  const params = useLocalSearchParams<{ budgetId: string }>()
  const budgetId = params.budgetId

  const isAddMode = budgetId === NewEnum.NEW || !budgetId

  if (isAddMode) {
    return <AddScreen />
  }

  return <EnhancedEditScreen budgetId={budgetId} />
}
