import { withObservables } from "@nozbe/watermelondb/react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { GoalCard } from "~/components/goals/goal-card"
import { IconSvg } from "~/components/ui/icon-svg"
import { Pressable } from "~/components/ui/pressable"
import { Text } from "~/components/ui/text"
import { View } from "~/components/ui/view"
import { observeGoals } from "~/database/services/goal-service"
import type { Goal } from "~/types/goals"
import { NewEnum } from "~/types/new"

interface GoalsListContentProps {
  goals: Goal[]
}

function GoalsListContent({ goals }: GoalsListContentProps) {
  const { theme } = useUnistyles()
  const { t } = useTranslation()
  const router = useRouter()

  const handleAddGoal = () => {
    router.push(`/settings/goals/${NewEnum.NEW}/modify`)
  }

  const handleGoalPress = (goalId: string) => {
    router.push(`/settings/goals/${goalId}/modify`)
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="small" style={styles.emptyText}>
              {t("screens.settings.goals.empty")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={() => handleGoalPress(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Pressable
        onPress={handleAddGoal}
        style={styles.fab}
        accessibilityLabel={t("screens.settings.goals.addNew")}
        accessibilityRole="button"
      >
        <IconSvg name="plus" size={24} color={theme.colors.onPrimary} />
      </Pressable>
    </View>
  )
}

const EnhancedGoalsList = withObservables([], () => ({
  goals: observeGoals(),
}))(GoalsListContent)

export default function GoalsScreen() {
  return <EnhancedGoalsList />
}

const styles = StyleSheet.create((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.secondary,
    borderRadius: t.radius,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: t.radius,

    backgroundColor: t.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: t.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
}))
