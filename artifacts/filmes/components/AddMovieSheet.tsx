import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ApiError,
  getGetMovieDetailQueryKey,
  useGetMovieDetail,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import type { MovieStatus } from "@/contexts/MoviesContext";

export interface AddMovieDraft {
  tmdbId: number | null;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
}

const STATUS_OPTIONS: {
  value: MovieStatus;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: "want", label: "Quero Ver", icon: "bookmark" },
  { value: "watched", label: "Já Vi", icon: "check-circle" },
  { value: "abandoned", label: "Desisti", icon: "x-circle" },
];

interface Props {
  movie: AddMovieDraft | null;
  onClose: () => void;
  onPick: (status: MovieStatus) => void;
}

export function AddMovieSheet({ movie, onClose, onPick }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [showSynopsis, setShowSynopsis] = useState(false);

  const visible = movie != null;
  const tmdbId = movie?.tmdbId ?? null;
  const canFetchSynopsis = visible && tmdbId != null && showSynopsis;

  const { data, isFetching, isError, error } = useGetMovieDetail(tmdbId ?? 0, {
    query: {
      enabled: canFetchSynopsis,
      queryKey: getGetMovieDetailQueryKey(tmdbId ?? 0),
      staleTime: 1000 * 60 * 30,
    },
  });

  const errorText = useMemo(() => {
    if (!isError) return null;
    if (error instanceof ApiError) {
      const data = error.data as { error?: string } | null;
      return data?.error ?? "Não foi possível carregar a sinopse.";
    }
    return "Não foi possível carregar a sinopse.";
  }, [isError, error]);

  // Reset synopsis state when sheet closes
  const handleRequestClose = () => {
    setShowSynopsis(false);
    onClose();
  };

  const handlePick = (status: MovieStatus) => {
    setShowSynopsis(false);
    onPick(status);
  };

  if (!movie) {
    return (
      <Modal
        visible={false}
        transparent
        animationType="fade"
        onRequestClose={handleRequestClose}
      >
        <View />
      </Modal>
    );
  }

  const overview = data?.overview ?? null;
  const tagline = data?.tagline ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
    >
      <Pressable style={styles.backdrop} onPress={handleRequestClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              maxHeight: height * 0.85,
              paddingBottom: insets.bottom + 16,
              borderTopLeftRadius: colors.radius * 2,
              borderTopRightRadius: colors.radius * 2,
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
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
                  <Image
                    source={{ uri: movie.posterUrl }}
                    style={styles.poster}
                    contentFit="cover"
                  />
                ) : (
                  <Feather
                    name="film"
                    size={28}
                    color={colors.mutedForeground}
                  />
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={[styles.title, { color: colors.foreground }]}
                  numberOfLines={3}
                >
                  {movie.titlePtBr}
                </Text>
                {movie.originalTitle &&
                movie.originalTitle !== movie.titlePtBr ? (
                  <Text
                    style={[styles.original, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {movie.originalTitle}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  {movie.year ? (
                    <Text
                      style={[styles.meta, { color: colors.mutedForeground }]}
                    >
                      {movie.year}
                    </Text>
                  ) : null}
                  {movie.year && movie.rating != null ? (
                    <Text
                      style={[styles.meta, { color: colors.mutedForeground }]}
                    >
                      ·
                    </Text>
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
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={[styles.sectionLabel, { color: colors.mutedForeground }]}
              >
                Onde adicionar?
              </Text>
              <View style={{ gap: 8 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => handlePick(opt.value)}
                    style={({ pressed }) => [
                      styles.statusBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.statusText, { color: colors.foreground }]}
                    >
                      {opt.label}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {tmdbId != null ? (
              <View
                style={[
                  styles.synopsisCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Pressable
                  onPress={() => setShowSynopsis((s) => !s)}
                  style={({ pressed }) => [
                    styles.synopsisHeader,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showSynopsis ? "Ocultar sinopse" : "Ver sinopse"
                  }
                >
                  <Feather
                    name="file-text"
                    size={16}
                    color={colors.foreground}
                  />
                  <Text
                    style={[
                      styles.synopsisTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Sinopse
                  </Text>
                  <Feather
                    name={showSynopsis ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                {showSynopsis ? (
                  <View style={styles.synopsisBody}>
                    {tagline ? (
                      <Text
                        style={[
                          styles.tagline,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        “{tagline}”
                      </Text>
                    ) : null}
                    {isFetching ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.body,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Carregando sinopse...
                        </Text>
                      </View>
                    ) : errorText ? (
                      <Text
                        style={[styles.body, { color: colors.destructive }]}
                      >
                        {errorText}
                      </Text>
                    ) : overview ? (
                      <Text style={[styles.body, { color: colors.foreground }]}>
                        {overview}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.body,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Sinopse indisponível em português.
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}

            <Pressable
              onPress={handleRequestClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[styles.cancelText, { color: colors.mutedForeground }]}
              >
                Cancelar
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  headerRow: { flexDirection: "row", gap: 14 },
  posterWrap: {
    width: 80,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  poster: { width: "100%", height: "100%" },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  original: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  meta: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  synopsisCard: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  synopsisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  synopsisTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  synopsisBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
