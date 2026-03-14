import { Model } from "@nozbe/watermelondb"
import { date, field } from "@nozbe/watermelondb/decorators"

/**
 * Join table model linking budgets to categories.
 * A budget can track spending across multiple categories.
 */
export default class BudgetCategoryModel extends Model {
  static table = "budget_categories"

  @field("budget_id") budgetId!: string
  @field("category_id") categoryId!: string
  @date("created_at") createdAt!: Date
}
