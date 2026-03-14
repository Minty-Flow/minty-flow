import { z } from "zod"

const addGoalSchema = z.object({
  name: z.string().min(1, "validation.goal.name.required"),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  colorSchemeName: z.string().nullable().optional(),
  currencyCode: z.string().min(1, "validation.goal.currency.required"),
  accountIds: z.array(z.string()).min(1, "validation.goal.accounts.required"),
  targetAmount: z.number().positive("validation.goal.targetAmount.positive"),
  targetDate: z.number().nullable().optional(), // Unix timestamp
  isCompleted: z.boolean(),
})

const updateGoalSchema = addGoalSchema

export { addGoalSchema, updateGoalSchema }
export type AddGoalFormSchema = z.infer<typeof addGoalSchema>
export type UpdateGoalFormSchema = z.infer<typeof updateGoalSchema>
