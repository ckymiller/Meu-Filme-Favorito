import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MovieRow } from "@/components/MovieRow";
import { MovieStatus, useMovies } from "@/contexts/MoviesContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  status: MovieStatus;
  emptyMessage: string;
}

export function MovieList({ status, emptyMessage }: Props) {
  const { byStatus, loaded } = useMovies();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const data = byStatus(status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        renderItem={({ item }) => <MovieRow movie={item} />}
        scrollEnabled={data.length > 0}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Feather name="film" size={42} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nenhum filme aqui
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {emptyMessage}
              </Text>
            </View>
          ) : null
        }
      />
      <Pressable
        onPress={() => router.push("/add")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
});
