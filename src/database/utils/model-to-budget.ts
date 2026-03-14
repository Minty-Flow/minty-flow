import type { Budget } from "~/types/budgets"

import type BudgetModel from "../models/budget"

/**
 * Convert BudgetModel to Budget domain type.
 *
 * accountIds is passed as a parameter because it is derived from the
 * budget_accounts join table by the service layer — not stored on the model itself.
 */
export const modelToBudget = (
  model: BudgetModel,
  accountIds: string[],
  categoryIds: string[],
): Budget => {
  return {
    id: model.id,
    name: model.name,
    amount: model.amount,
    currencyCode: model.currencyCode,
    period: model.period,
    startDate: model.startDate,
    endDate: model.endDate,
    categoryIds,
    alertThreshold: model.alertThreshold,
    isActive: model.isActive,
    icon: model.icon,
    colorSchemeName: model.colorSchemeName,
    colorScheme: model.colorScheme, // Computed getter from model
    accountIds,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  }
}
