import { withObservables } from "@nozbe/watermelondb/react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { BudgetCard } from "~/components/budgets/budget-card"
import { Button } from "~/components/ui/button"
import { IconSvg } from "~/components/ui/icon-svg"
import { Text } from "~/components/ui/text"
import { View } from "~/components/ui/view"
import { observeBudgets } from "~/database/services/budget-service"
import type { Budget } from "~/types/budgets"
import { NewEnum } from "~/types/new"

// ---------------------------------------------------------------------------
// Observed list component — re-renders reactively when budgets change
// ---------------------------------------------------------------------------

interface BudgetListContentInnerProps {
  budgets: Budget[]
}

function BudgetListContentInner({ budgets }: BudgetListContentInnerProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation()
  const router = useRouter()

  const handleAddBudget = () => {
    router.push(`/settings/budgets/${NewEnum.NEW}/modify`)
  }

  const handleEditBudget = (budgetId: string) => {
    router.push(`/settings/budgets/${budgetId}/modify`)
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button onPress={handleAddBudget} style={styles.addButton}>
              <IconSvg name="plus" size={20} color={theme.colors.onPrimary} />
              <Text variant="default" style={styles.buttonText}>
                {t("screens.settings.budgets.addNew")}
              </Text>
            </Button>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="small" style={styles.emptyText}>
              {t("screens.settings.budgets.empty")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BudgetCard budget={item} onPress={() => handleEditBudget(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  )
}

// Wrap with WatermelonDB reactive observer — budgets update automatically
const BudgetListContent = withObservables([], () => ({
  budgets: observeBudgets(),
}))(BudgetListContentInner)

export default function BudgetsScreen() {
  return <BudgetListContent />
}

const styles = StyleSheet.create((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface,
  },
  header: {
    paddingBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  buttonText: {
    color: t.colors.onPrimary,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.secondary,
    borderRadius: t.colors.radius,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: t.colors.onSecondary,
    textAlign: "center",
  },
  separator: {
    height: 0,
  },
}))
