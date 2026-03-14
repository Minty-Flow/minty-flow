import { withObservables } from "@nozbe/watermelondb/react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList } from "react-native"
import { StyleSheet, useUnistyles } from "react-native-unistyles"

import { GoalCard } from "~/components/goals/goal-card"
import { Button } from "~/components/ui/button"
import { IconSvg } from "~/components/ui/icon-svg"
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
        ListHeaderComponent={
          <View style={styles.header}>
            <Button onPress={handleAddGoal} style={styles.addButton}>
              <IconSvg name="plus" size={20} color={theme.colors.onPrimary} />
              <Text variant="default" style={styles.buttonText}>
                {t("screens.settings.goals.addNew")}
              </Text>
            </Button>
          </View>
        }
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
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    paddingBottom: 4,
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
