import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { Movie, MovieStatus, useMovies } from "@/contexts/MoviesContext";

const STATUS_LABELS: Record<MovieStatus, string> = {
  want: "Quero Ver",
  watched: "Já Vi",
  abandoned: "Desisti",
};

interface Props {
  movie: Movie;
}

export function MovieRow({ movie }: Props) {
  const colors = useColors();
  const { updateStatus, removeMovie } = useMovies();

  const showActions = () => {
    const otherStatuses: MovieStatus[] = (
      ["want", "watched", "abandoned"] as MovieStatus[]
    ).filter((s) => s !== movie.status);

    Alert.alert(
      movie.titlePtBr,
      "Escolha uma ação",
      [
        ...otherStatuses.map((s) => ({
          text: `Mover para “${STATUS_LABELS[s]}”`,
          onPress: () => updateStatus(movie.id, s),
        })),
        {
          text: "Remover",
          style: "destructive" as const,
          onPress: () =>
            Alert.alert("Remover filme?", `“${movie.titlePtBr}” será removido.`, [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Remover",
                style: "destructive",
                onPress: () => removeMovie(movie.id),
              },
            ]),
        },
        { text: "Cancelar", style: "cancel" as const },
      ],
      { cancelable: true },
    );
  };

  return (
    <Pressable
      onPress={showActions}
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
      <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
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
