import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { type MovieStatus, useMovies } from "@/contexts/MoviesContext";
import { TmdbError, useGetMovieDetail } from "@/lib/tmdb";

const STATUS_LABELS: Record<MovieStatus, string> = {
  want: "Quero Ver",
  watched: "Já Vi",
  abandoned: "Desisti",
};

const STATUS_ICONS: Record<MovieStatus, keyof typeof Feather.glyphMap> = {
  want: "bookmark",
  watched: "check-circle",
  abandoned: "x-circle",
};

export default function MovieDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { findById, updateStatus, removeMovie } = useMovies();

  const movie = findById(params.id);
  const tmdbId = movie?.tmdbId ?? null;

  const { data, isFetching, isError, error } = useGetMovieDetail(tmdbId, {
    enabled: tmdbId != null,
  });

  const errorText = useMemo(() => {
    if (!isError) return null;
    if (error instanceof TmdbError) {
      return error.message || "Não foi possível carregar a sinopse.";
    }
    return "Não foi possível carregar a sinopse.";
  }, [isError, error]);

  if (!movie) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 24 }]}>
        <Stack.Screen options={{ title: "Filme" }} />
        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>
          Filme não encontrado.
        </Text>
      </View>
    );
  }

  const overview = data?.overview ?? null;
  const tagline = data?.tagline ?? null;
  const genres = data?.genres ?? [];
  const runtime = data?.runtime ?? null;
  const backdropUrl = data?.backdropUrl ?? null;

  const onChangeStatus = (newStatus: MovieStatus) => {
    if (newStatus === movie.status) return;
    updateStatus(movie.id, newStatus);
  };

  const onRemove = () => {
    Alert.alert("Remover filme?", `“${movie.titlePtBr}” será removido.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          removeMovie(movie.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.heroWrap}>
          {backdropUrl ? (
            <Image source={{ uri: backdropUrl }} style={styles.backdrop} contentFit="cover" />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: colors.muted }]} />
          )}
          <View
            style={[
              styles.backdropOverlay,
              { backgroundColor: colors.background + "cc" },
            ]}
          />
        </View>

        <View style={styles.headerRow}>
          <View
            style={[
              styles.posterWrap,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            {movie.posterUrl ? (
              <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />
            ) : (
              <Feather name="film" size={40} color={colors.mutedForeground} />
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>
              {movie.titlePtBr}
            </Text>
            {movie.originalTitle && movie.originalTitle !== movie.titlePtBr ? (
              <Text
                style={[styles.original, { color: colors.mutedForeground }]}
                numberOfLines={2}
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
              {movie.year && runtime ? (
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>·</Text>
              ) : null}
              {runtime ? (
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {runtime} min
                </Text>
              ) : null}
              {(movie.year || runtime) && movie.rating != null ? (
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>·</Text>
              ) : null}
              {movie.rating != null ? (
                <View style={styles.ratingRow}>
                  <Feather name="star" size={13} color={colors.primary} />
                  <Text style={[styles.rating, { color: colors.primary }]}>
                    {movie.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {genres.length > 0 ? (
          <View style={styles.genresRow}>
            {genres.map((g) => (
              <View
                key={g}
                style={[
                  styles.genreChip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.genreText, { color: colors.foreground }]}>{g}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Status</Text>
          <View style={styles.statusRow}>
            {(Object.keys(STATUS_LABELS) as MovieStatus[]).map((s) => {
              const active = movie.status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => onChangeStatus(s)}
                  style={({ pressed }) => [
                    styles.statusChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={STATUS_ICONS[s]}
                    size={16}
                    color={active ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: active ? colors.primaryForeground : colors.foreground,
                      },
                    ]}
                  >
                    {STATUS_LABELS[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sinopse</Text>
          {tagline ? (
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              “{tagline}”
            </Text>
          ) : null}
          {tmdbId == null ? (
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Filme adicionado manualmente — sem sinopse disponível.
            </Text>
          ) : isFetching ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Carregando sinopse...
              </Text>
            </View>
          ) : errorText ? (
            <Text style={[styles.body, { color: colors.destructive }]}>{errorText}</Text>
          ) : overview ? (
            <Text style={[styles.body, { color: colors.foreground }]}>{overview}</Text>
          ) : (
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Sinopse indisponível.
            </Text>
          )}
        </View>

        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.destructive,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.removeText, { color: colors.destructive }]}>
            Remover da lista
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    overflow: "hidden",
  },
  backdrop: { width: "100%", height: "100%" },
  backdropOverlay: { ...StyleSheet.absoluteFillObject },
  headerRow: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
  },
  posterWrap: {
    width: 110,
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  poster: { width: "100%", height: "100%" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  original: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  meta: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  genreText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { padding: 16, gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  removeText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
