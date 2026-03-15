import type BudgetModel from "~/database/models/budget"
import type { Account } from "~/types/accounts"
import type { Budget } from "~/types/budgets"
import type { Category } from "~/types/categories"

export interface BudgetModifyContentProps {
  budgetModifyId: string
  budget?: Budget
  budgetModel?: BudgetModel
  accounts: Account[]
  categories: Category[]
}
