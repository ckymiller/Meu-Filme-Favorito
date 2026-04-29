import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ApiError,
  MovieSearchResult,
  getSearchMoviesQueryKey,
  useSearchMovies,
} from "@workspace/api-client-react";

import { AddMovieSheet, type AddMovieDraft } from "@/components/AddMovieSheet";
import { MovieStatus, useMovies } from "@/contexts/MoviesContext";
import { useColors } from "@/hooks/useColors";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function AddMovieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMovie, hasTmdbId } = useMovies();

  const [query, setQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<AddMovieDraft | null>(null);

  const debouncedQuery = useDebounced(query.trim(), 400);

  const searchEnabled = !manualMode && debouncedQuery.length >= 2;
  const { data, isFetching, isError, error } = useSearchMovies(
    { q: debouncedQuery },
    {
      query: {
        enabled: searchEnabled,
        queryKey: getSearchMoviesQueryKey({ q: debouncedQuery }),
      },
    },
  );

  const errorText = useMemo(() => {
    if (!isError) return null;
    if (error instanceof ApiError) {
      const data = error.data as { error?: string } | null;
      return data?.error ?? "Erro ao buscar filmes.";
    }
    return "Erro ao buscar filmes.";
  }, [isError, error]);

  const promptStatusAndAdd = (movie: AddMovieDraft) => {
    setPendingMovie(movie);
  };

  const handlePickStatus = async (status: MovieStatus) => {
    if (!pendingMovie) return;
    const movie = pendingMovie;
    setPendingMovie(null);
    await addMovie({ ...movie, status });
    router.back();
  };

  const onPickResult = (result: MovieSearchResult) => {
    if (hasTmdbId(result.tmdbId)) {
      Alert.alert("Filme já está na sua lista", result.titlePtBr);
      return;
    }
    promptStatusAndAdd({
      tmdbId: result.tmdbId,
      titlePtBr: result.titlePtBr,
      originalTitle: result.originalTitle,
      year: result.year,
      rating: result.rating,
      posterUrl: result.posterUrl,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "web" ? 16 : 0,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: manualMode ? "Adicionar manualmente" : "Adicionar filme",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground, fontFamily: "Inter_700Bold" },
          headerTintColor: colors.primary,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 4 }}
              hitSlop={10}
            >
              <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 16 }}>
                Cancelar
              </Text>
            </Pressable>
          ),
        }}
      />
      {manualMode ? (
        <ManualForm
          onCancel={() => setManualMode(false)}
          onSubmit={(m) => promptStatusAndAdd(m)}
        />
      ) : (
        <>
          <View style={styles.searchWrap}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.muted,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar filme..."
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                autoCorrect={false}
                returnKeyType="search"
                style={[
                  styles.input,
                  { color: colors.foreground, fontFamily: "Inter_400Regular" },
                ]}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <FlatList
            data={searchEnabled ? data ?? [] : []}
            keyExtractor={(item) => String(item.tmdbId)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 24,
              gap: 8,
            }}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
            renderItem={({ item }) => (
              <SearchRow item={item} onPress={() => onPickResult(item)} />
            )}
            ListHeaderComponent={
              isFetching && searchEnabled ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    Buscando...
                  </Text>
                </View>
              ) : errorText ? (
                <Text
                  style={{
                    color: colors.destructive,
                    fontFamily: "Inter_500Medium",
                    paddingVertical: 12,
                    textAlign: "center",
                  }}
                >
                  {errorText}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !searchEnabled ? (
                <View style={styles.hint}>
                  <Feather name="search" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                    Digite ao menos 2 letras para buscar.
                  </Text>
                </View>
              ) : !isFetching ? (
                <View style={styles.hint}>
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                    Nenhum resultado encontrado.
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              <Pressable
                onPress={() => setManualMode(true)}
                style={({ pressed }) => [
                  styles.manualButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="edit-3" size={18} color={colors.primary} />
                <Text style={[styles.manualText, { color: colors.primary }]}>
                  Adicionar manualmente
                </Text>
              </Pressable>
            }
          />
        </>
      )}
      <AddMovieSheet
        movie={pendingMovie}
        onClose={() => setPendingMovie(null)}
        onPick={handlePickStatus}
      />
    </View>
  );
}

function SearchRow({
  item,
  onPress,
}: {
  item: MovieSearchResult;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.searchRow,
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
        {item.posterUrl ? (
          <Image source={{ uri: item.posterUrl }} style={styles.poster} contentFit="cover" />
        ) : (
          <Feather name="film" size={22} color={colors.mutedForeground} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}
          numberOfLines={2}
        >
          {item.titlePtBr}
        </Text>
        {item.originalTitle && item.originalTitle !== item.titlePtBr ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              fontStyle: "italic",
            }}
            numberOfLines={1}
          >
            {item.originalTitle}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.year ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium" }}>
              {item.year}
            </Text>
          ) : null}
          {item.year && item.rating != null ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>·</Text>
          ) : null}
          {item.rating != null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Feather name="star" size={11} color={colors.primary} />
              <Text
                style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}
              >
                {item.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Feather name="plus-circle" size={22} color={colors.primary} />
    </Pressable>
  );
}

function ManualForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (movie: {
    tmdbId: number | null;
    titlePtBr: string;
    originalTitle: string;
    year: number | null;
    rating: number | null;
    posterUrl: string | null;
  }) => void;
}) {
  const colors = useColors();
  const [titlePtBr, setTitlePtBr] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");

  const submit = () => {
    const trimmedPt = titlePtBr.trim();
    const trimmedOriginal = originalTitle.trim();
    if (!trimmedPt && !trimmedOriginal) {
      Alert.alert("Informe o nome", "Preencha pelo menos um dos campos de nome.");
      return;
    }
    const finalPt = trimmedPt || trimmedOriginal;
    const finalOriginal = trimmedOriginal || trimmedPt;
    const yearNum = year.trim() ? parseInt(year.trim(), 10) : NaN;
    const ratingNum = rating.trim() ? parseFloat(rating.trim().replace(",", ".")) : NaN;

    onSubmit({
      tmdbId: null,
      titlePtBr: finalPt,
      originalTitle: finalOriginal,
      year: Number.isFinite(yearNum) ? yearNum : null,
      rating: Number.isFinite(ratingNum) ? ratingNum : null,
      posterUrl: null,
    });
  };

  const labelStyle = {
    color: colors.mutedForeground,
    fontFamily: "Inter_500Medium" as const,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  const inputStyle = {
    backgroundColor: colors.card,
    color: colors.foreground,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: colors.radius,
    padding: 14,
    fontFamily: "Inter_400Regular" as const,
    fontSize: 16,
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 14 }}>
      <View>
        <Text style={labelStyle}>Nome em português</Text>
        <TextInput
          value={titlePtBr}
          onChangeText={setTitlePtBr}
          placeholder="Ex.: A Origem"
          placeholderTextColor={colors.mutedForeground}
          style={inputStyle}
          autoFocus
        />
      </View>
      <View>
        <Text style={labelStyle}>Nome original</Text>
        <TextInput
          value={originalTitle}
          onChangeText={setOriginalTitle}
          placeholder="Ex.: Inception"
          placeholderTextColor={colors.mutedForeground}
          style={inputStyle}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>Ano</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="2010"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            maxLength={4}
            style={inputStyle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>Nota (0-10)</Text>
          <TextInput
            value={rating}
            onChangeText={setRating}
            placeholder="8.5"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={inputStyle}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
            Voltar
          </Text>
        </Pressable>
        <Pressable
          onPress={submit}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
              flex: 1.4,
            },
          ]}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
            }}
          >
            Continuar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: Platform.OS === "ios" ? 4 : 8 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  hint: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  hintText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  posterWrap: {
    width: 50,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  poster: { width: "100%", height: "100%" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  manualText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
