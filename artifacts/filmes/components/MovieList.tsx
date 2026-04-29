import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MovieRow } from "@/components/MovieRow";
import { MovieGridCard } from "@/components/MovieGridCard";
import { MovieStatus, useMovies } from "@/contexts/MoviesContext";
import { useColors } from "@/hooks/useColors";
import { usePreferences } from "@/lib/preferences";

interface Props {
  status: MovieStatus;
  emptyMessage: string;
}

const GRID_PADDING = 12;
const GRID_GAP = 10;

function computeColumns(screenWidth: number): number {
  if (screenWidth >= 900) return 5;
  if (screenWidth >= 700) return 4;
  if (screenWidth >= 500) return 3;
  return 2;
}

export function MovieList({ status, emptyMessage }: Props) {
  const { byStatus, loaded } = useMovies();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { viewMode } = usePreferences();
  const { width } = useWindowDimensions();

  const data = byStatus(status);
  const isGrid = viewMode === "grid";

  const numColumns = isGrid ? computeColumns(width) : 1;
  const cardWidth = isGrid
    ? Math.floor(
        (width - GRID_PADDING * 2 - GRID_GAP * (numColumns - 1)) / numColumns,
      )
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        key={isGrid ? `grid-${numColumns}` : "list"}
        data={data}
        keyExtractor={(m) => m.id}
        numColumns={numColumns}
        columnWrapperStyle={
          isGrid && numColumns > 1 ? { gap: GRID_GAP } : undefined
        }
        contentContainerStyle={{
          padding: isGrid ? GRID_PADDING : 16,
          gap: isGrid ? GRID_GAP : 10,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        renderItem={({ item }) =>
          isGrid ? (
            <MovieGridCard movie={item} width={cardWidth} />
          ) : (
            <MovieRow movie={item} />
          )
        }
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
