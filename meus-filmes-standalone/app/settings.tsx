import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMovies } from "@/contexts/MoviesContext";
import { useColors } from "@/hooks/useColors";
import { usePreferences } from "@/lib/preferences";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { viewMode, setViewMode } = usePreferences();
  const { movies } = useMovies();

  const counts = {
    want: movies.filter((m) => m.status === "want").length,
    watched: movies.filter((m) => m.status === "watched").length,
    abandoned: movies.filter((m) => m.status === "abandoned").length,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Configurações",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
          },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* View mode */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Visualização
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <ToggleRow
              icon="list"
              label="Lista"
              active={viewMode === "list"}
              onPress={() => setViewMode("list")}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow
              icon="grid"
              label="Grade"
              active={viewMode === "grid"}
              onPress={() => setViewMode("grid")}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Suas listas
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <StatRow icon="bookmark" label="Quero Ver" count={counts.want} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatRow icon="check-circle" label="Já Vi" count={counts.watched} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatRow icon="x-circle" label="Desisti" count={counts.abandoned} />
          </View>
        </View>

        {/* About */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Sobre
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                padding: 16,
                gap: 8,
              },
            ]}
          >
            <Text style={[styles.aboutText, { color: colors.foreground }]}>
              Meus Filmes
            </Text>
            <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>
              App pessoal pra organizar filmes em três listas.{"\n"}
              Os dados ficam salvos só no seu celular.{"\n"}
              Buscas via The Movie Database (TMDB).
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={colors.foreground} />
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      {active ? (
        <Feather name="check" size={20} color={colors.primary} />
      ) : (
        <View style={{ width: 20 }} />
      )}
    </Pressable>
  );
}

function StatRow({
  icon,
  label,
  count,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  count: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.rowCount, { color: colors.mutedForeground }]}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  rowCount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  aboutText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  aboutSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
