import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigation, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ChangeIconInline } from "~/components/change-icon-inline"
import { ColorVariantInline } from "~/components/color-variant-inline"
import { CurrencyAccountSelector } from "~/components/currency-account-selector"
import { InlineCategoryPicker } from "~/components/inline-category-picker"
import { SmartAmountInput } from "~/components/smart-amount-input"
import { Button } from "~/components/ui/button"
import { Chip } from "~/components/ui/chips"
import { IconSvg } from "~/components/ui/icon-svg"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Text } from "~/components/ui/text"
import { View } from "~/components/ui/view"
import { ScrollIntoViewProvider } from "~/contexts/scroll-into-view-context"
import {
  createBudget,
  destroyBudget,
  updateBudget,
} from "~/database/services/budget-service"
import { useNavigationGuard } from "~/hooks/use-navigation-guard"
import type { TranslationKey } from "~/i18n/config"
import {
  type AddBudgetFormSchema,
  addBudgetSchema,
} from "~/schemas/budgets.schema"
import { getThemeStrict } from "~/styles/theme/registry"
import { BudgetPeriodEnum } from "~/types/budgets"
import { NewEnum } from "~/types/new"
import { logger } from "~/utils/logger"
import { Toast } from "~/utils/toast"

import { BudgetFormFooter } from "./budget-form-footer"
import { BudgetFormModals } from "./budget-form-modals"
import { budgetModifyStyles } from "./budget-modify.styles"
import type { BudgetModifyContentProps } from "./types"

// Period options for the chips selector
const PERIOD_OPTIONS = [
  BudgetPeriodEnum.DAILY,
  BudgetPeriodEnum.WEEKLY,
  BudgetPeriodEnum.MONTHLY,
  BudgetPeriodEnum.YEARLY,
] as const

export function BudgetModifyContent({
  budgetModifyId,
  budget,
  budgetModel,
  accounts,
  categories,
}: BudgetModifyContentProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const isAddMode = budgetModifyId === NewEnum.NEW || !budgetModifyId

  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const {
    control,
    handleSubmit: handleFormSubmit,
    formState: { errors, isDirty, isSubmitting },
    watch,
    setValue,
  } = useForm<AddBudgetFormSchema>({
    resolver: zodResolver(addBudgetSchema),
    defaultValues: {
      name: budget?.name ?? "",
      icon: budget?.icon ?? "chart-pie",
      colorSchemeName: budget?.colorSchemeName ?? undefined,
      currencyCode: budget?.currencyCode ?? "",
      accountIds: budget?.accountIds ?? [],
      amount: budget?.amount ?? 0,
      period: budget?.period ?? BudgetPeriodEnum.MONTHLY,
      startDate: budget?.startDate ? budget.startDate.getTime() : Date.now(),
      endDate: budget?.endDate ? budget.endDate.getTime() : null,
      categoryIds: budget?.categoryIds ?? [],
      alertThreshold: budget?.alertThreshold ?? null,
      isActive: budget?.isActive ?? true,
    },
  })

  const formName = watch("name")
  const formIcon = watch("icon")
  const formColorSchemeName = watch("colorSchemeName")
  const watchedCurrencyCode = watch("currencyCode")
  const watchedAccountIds = watch("accountIds")
  const watchedPeriod = watch("period")
  const watchedCategoryIds = watch("categoryIds")
  const watchedAlertThreshold = watch("alertThreshold")

  const navigation = useNavigation()
  const [unsavedModalVisible, setUnsavedModalVisible] = useState(false)
  const { confirmNavigation, allowNavigation } = useNavigationGuard({
    navigation,
    when: isDirty && !isSubmitting,
    onConfirm: handleGoBack,
    onBlock: () => setUnsavedModalVisible(true),
  })

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const onSubmit = async (data: AddBudgetFormSchema) => {
    const trimmedName = data.name.trim()

    try {
      if (isAddMode) {
        await createBudget({ ...data, name: trimmedName })

        allowNavigation()
        handleGoBack()
      } else {
        if (!budgetModel) {
          Toast.error({
            title: t("common.toast.error"),
            description: t(
              "screens.settings.budgets.form.toast.notFound" as TranslationKey,
            ),
          })
          return
        }

        await updateBudget(budgetModel, { ...data, name: trimmedName })

        allowNavigation()
        handleGoBack()
      }
    } catch (error) {
      logger.error("Error saving budget", { error })
      Toast.error({
        title: t("common.toast.error"),
        description: t(
          isAddMode
            ? ("screens.settings.budgets.form.toast.createFailed" as TranslationKey)
            : ("screens.settings.budgets.form.toast.updateFailed" as TranslationKey),
        ),
      })
    }
  }

  const handleSubmit = handleFormSubmit(onSubmit)

  const handleDelete = async () => {
    try {
      if (!budgetModel || !budget) {
        Toast.error({
          title: t("common.toast.error"),
          description: t(
            "screens.settings.budgets.form.toast.notFound" as TranslationKey,
          ),
        })
        return
      }

      await destroyBudget(budgetModel)

      allowNavigation()
      router.dismiss(2)
    } catch (error) {
      logger.error("Error deleting budget", { error })
      Toast.error({
        title: t("common.toast.error"),
        description: t(
          "screens.settings.budgets.form.toast.deleteFailed" as TranslationKey,
        ),
      })
    }
  }

  const handleIconSelected = (icon: string | null) => {
    setValue("icon", icon, { shouldDirty: true })
  }

  const handleColorSelected = (schemeName: string) => {
    setValue("colorSchemeName", schemeName, { shouldDirty: true })
  }

  const handleColorCleared = () => {
    setValue("colorSchemeName", undefined, { shouldDirty: true })
  }

  const currentColorScheme = getThemeStrict(formColorSchemeName)

  if (!isAddMode && !budget) {
    return (
      <View style={budgetModifyStyles.container}>
        <View style={budgetModifyStyles.loadingContainer}>
          <Text variant="default">
            {t("screens.settings.budgets.form.loadingText" as TranslationKey)}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={budgetModifyStyles.container}>
      <ScrollIntoViewProvider
        scrollViewStyle={budgetModifyStyles.scrollView}
        contentContainerStyle={budgetModifyStyles.scrollContent}
      >
        <View style={budgetModifyStyles.form} key={budget?.id ?? NewEnum.NEW}>
          {/* Icon picker */}
          <ChangeIconInline
            currentIcon={formIcon}
            onIconSelected={handleIconSelected}
            colorScheme={currentColorScheme}
          />

          {/* Name section */}
          <View style={budgetModifyStyles.nameSection}>
            <Text variant="small" style={budgetModifyStyles.label}>
              {t("screens.settings.budgets.form.nameLabel" as TranslationKey)}
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t(
                    "screens.settings.budgets.form.namePlaceholder" as TranslationKey,
                  )}
                  error={!!errors.name}
                />
              )}
            />
            {errors.name && (
              <Text variant="small" style={budgetModifyStyles.errorText}>
                {t(errors.name.message as TranslationKey)}
              </Text>
            )}
          </View>

          {/* Settings list: color, currency/accounts, period, category, amount, alert threshold */}
          <View style={budgetModifyStyles.settingsList}>
            {/* Color selector */}
            <ColorVariantInline
              selectedSchemeName={formColorSchemeName ?? undefined}
              onColorSelected={handleColorSelected}
              onClearSelection={handleColorCleared}
            />

            {/* Currency + Accounts selector */}
            <CurrencyAccountSelector
              accounts={accounts}
              selectedCurrency={watchedCurrencyCode || null}
              selectedAccountIds={watchedAccountIds}
              onCurrencyChange={(c) =>
                setValue("currencyCode", c, { shouldDirty: true })
              }
              onAccountIdsChange={(ids) =>
                setValue("accountIds", ids, { shouldDirty: true })
              }
            />

            {/* Period chips row */}
            <View style={budgetModifyStyles.periodSection}>
              <Text variant="small" style={budgetModifyStyles.periodLabel}>
                {t(
                  "screens.settings.budgets.form.periodLabel" as TranslationKey,
                )}
              </Text>
              <View style={budgetModifyStyles.periodChipsRow}>
                {PERIOD_OPTIONS.map((period) => (
                  <Chip
                    key={period}
                    label={t(
                      `screens.settings.budgets.periods.${period}` as TranslationKey,
                    )}
                    selected={watchedPeriod === period}
                    onPress={() =>
                      setValue("period", period, { shouldDirty: true })
                    }
                  />
                ))}
              </View>
            </View>

            {/* Category picker row */}
            <InlineCategoryPicker
              categories={categories}
              selectedIds={watchedCategoryIds}
              onSelectionChange={(ids) =>
                setValue("categoryIds", ids, { shouldDirty: true })
              }
              label={t("screens.settings.budgets.form.categoryLabel")}
            />

            {/* Amount input */}
            <View style={budgetModifyStyles.amountSection}>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <SmartAmountInput
                    value={value}
                    onChange={onChange}
                    currencyCode={watchedCurrencyCode || undefined}
                    label={t("screens.settings.budgets.form.amountLabel")}
                    error={
                      errors.amount
                        ? t(errors.amount.message as TranslationKey)
                        : undefined
                    }
                  />
                )}
              />
            </View>

            {/* Alert threshold input (optional %) */}
            <View style={budgetModifyStyles.amountSection}>
              <Text variant="small" style={budgetModifyStyles.label}>
                {t(
                  "screens.settings.budgets.form.alertThresholdLabel" as TranslationKey,
                )}
              </Text>
              <Controller
                control={control}
                name="alertThreshold"
                render={({ field: { onChange, onBlur } }) => (
                  <Input
                    value={
                      watchedAlertThreshold != null
                        ? String(watchedAlertThreshold)
                        : ""
                    }
                    onChangeText={(text) => {
                      if (text === "") {
                        onChange(null)
                        return
                      }
                      const parsed = Number.parseFloat(text)
                      onChange(Number.isNaN(parsed) ? null : parsed)
                    }}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    placeholder="80"
                    error={!!errors.alertThreshold}
                  />
                )}
              />
              {errors.alertThreshold && (
                <Text variant="small" style={budgetModifyStyles.errorText}>
                  {t(errors.alertThreshold.message as TranslationKey)}
                </Text>
              )}
            </View>
          </View>

          <Separator />
        </View>

        {/* Delete button (edit mode only) */}
        {!isAddMode && (
          <View style={budgetModifyStyles.deleteSection}>
            <Button
              variant="ghost"
              onPress={() => setDeleteModalVisible(true)}
              style={budgetModifyStyles.actionButton}
            >
              <IconSvg
                name="trash"
                size={20}
                color={budgetModifyStyles.deleteIcon.color}
              />
              <Text variant="default" style={budgetModifyStyles.deleteText}>
                {t(
                  "screens.settings.budgets.form.deleteLabel" as TranslationKey,
                )}
              </Text>
            </Button>
          </View>
        )}
      </ScrollIntoViewProvider>

      <BudgetFormFooter
        formName={formName}
        isAddMode={isAddMode}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onCancel={handleGoBack}
        onSave={handleSubmit}
      />

      <BudgetFormModals
        deleteModalVisible={deleteModalVisible}
        unsavedModalVisible={unsavedModalVisible}
        isAddMode={isAddMode}
        budget={budget}
        onCloseDeleteModal={() => setDeleteModalVisible(false)}
        onCloseUnsavedModal={() => setUnsavedModalVisible(false)}
        onConfirmDelete={handleDelete}
        onDiscardAndNavigate={() => {
          setUnsavedModalVisible(false)
          confirmNavigation()
        }}
      />
    </View>
  )
}
