import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Movie } from "@/contexts/MoviesContext";
import { showMovieActions } from "@/components/MovieActions";

interface Props {
  movie: Movie;
  width: number;
}

export function MovieGridCard({ movie, width }: Props) {
  const colors = useColors();
  const router = useRouter();
  const posterHeight = (width * 3) / 2;

  return (
    <Pressable
      onPress={() => router.push(`/movie/${movie.id}`)}
      onLongPress={() => showMovieActions(movie)}
      style={({ pressed }) => [
        styles.card,
        { width, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View
        style={[
          styles.posterWrap,
          {
            width,
            height: posterHeight,
            backgroundColor: colors.muted,
            borderRadius: colors.radius,
            borderColor: colors.border,
          },
        ]}
      >
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />
        ) : (
          <Feather name="film" size={36} color={colors.mutedForeground} />
        )}
        {movie.rating != null ? (
          <View style={[styles.ratingBadge, { backgroundColor: colors.background + "ee" }]}>
            <Feather name="star" size={10} color={colors.primary} />
            <Text style={[styles.ratingText, { color: colors.primary }]}>
              {movie.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {movie.titlePtBr}
      </Text>
      {movie.year ? (
        <Text style={[styles.year, { color: colors.mutedForeground }]} numberOfLines={1}>
          {movie.year}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  posterWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  poster: { width: "100%", height: "100%" },
  ratingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ratingText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  year: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
