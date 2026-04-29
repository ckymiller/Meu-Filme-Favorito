import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Movie } from "@/contexts/MoviesContext";
import { showMovieActions } from "@/components/MovieActions";

interface Props {
  movie: Movie;
}

export function MovieRow({ movie }: Props) {
  const colors = useColors();
  const router = useRouter();

  const goToDetail = () => router.push(`/movie/${movie.id}`);

  return (
    <Pressable
      onPress={goToDetail}
      onLongPress={() => showMovieActions(movie)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.posterWrap,
          { backgroundColor: colors.muted, borderRadius: colors.radius - 4 },
        ]}
      >
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />
        ) : (
          <Feather name="film" size={26} color={colors.mutedForeground} />
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.titlePt, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {movie.titlePtBr}
        </Text>
        {movie.originalTitle && movie.originalTitle !== movie.titlePtBr ? (
          <Text
            style={[styles.titleOriginal, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {movie.originalTitle}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {movie.year ? (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {movie.year}
            </Text>
          ) : null}
          {movie.year && movie.rating != null ? (
            <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>·</Text>
          ) : null}
          {movie.rating != null ? (
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color={colors.primary} />
              <Text style={[styles.rating, { color: colors.primary }]}>
                {movie.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          showMovieActions(movie);
        }}
        hitSlop={12}
        style={{ padding: 4 }}
      >
        <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  posterWrap: {
    width: 56,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  poster: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 2 },
  titlePt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  titleOriginal: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  meta: { fontSize: 13, fontFamily: "Inter_500Medium" },
  metaDot: { fontSize: 13 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
