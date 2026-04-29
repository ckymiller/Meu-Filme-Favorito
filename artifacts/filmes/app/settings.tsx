import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";
import { useMovies } from "@/contexts/MoviesContext";
import { usePreferences } from "@/lib/preferences";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { syncing, movies } = useMovies();
  const { viewMode, setViewMode } = usePreferences();

  const onLogout = () => {
    Alert.alert(
      "Sair da conta?",
      "Seus filmes continuarão salvos neste aparelho.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => logout() },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Configurações",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground, fontFamily: "Inter_700Bold" },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          presentation: "modal",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 4 }}
              hitSlop={10}
            >
              <Text
                style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 16 }}
              >
                Fechar
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <Section title="Conta" colors={colors}>
          {isLoading ? (
            <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : isAuthenticated && user ? (
            <View style={[styles.userBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.userHeader}>
                {user.profileImageUrl ? (
                  <Image
                    source={{ uri: user.profileImageUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
                    ]}
                  >
                    <Feather name="user" size={22} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.email ||
                      "Conta conectada"}
                  </Text>
                  {user.email ? (
                    <Text
                      style={[styles.userEmail, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.syncRow, { borderTopColor: colors.border }]}>
                <Feather
                  name={syncing ? "refresh-cw" : "cloud"}
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.syncText, { color: colors.mutedForeground }]}>
                  {syncing
                    ? "Sincronizando..."
                    : `${movies.length} filme${movies.length === 1 ? "" : "s"} sincronizado${movies.length === 1 ? "" : "s"}`}
                </Text>
              </View>
              <Pressable
                onPress={onLogout}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="log-out" size={16} color={colors.foreground} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>
                  Sair da conta
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.loginBox,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              <Feather name="cloud" size={28} color={colors.primary} />
              <Text style={[styles.loginTitle, { color: colors.foreground }]}>
                Sincronize seus filmes
              </Text>
              <Text style={[styles.loginBody, { color: colors.mutedForeground }]}>
                Entre com sua conta Google para guardar suas listas na nuvem e
                acessá-las de qualquer aparelho. Seus filmes locais serão enviados
                automaticamente após o login.
              </Text>
              <Pressable
                onPress={() => login()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Feather name="log-in" size={18} color={colors.primaryForeground} />
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  Entrar com Google
                </Text>
              </Pressable>
              <Text style={[styles.loginFinePrint, { color: colors.mutedForeground }]}>
                Você poderá escolher Google na próxima tela.
              </Text>
            </View>
          )}
        </Section>

        <Section title="Aparência" colors={colors}>
          <View
            style={[
              styles.box,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Modo de exibição
            </Text>
            <View style={styles.segmented}>
              <SegBtn
                label="Lista"
                icon="list"
                active={viewMode === "list"}
                onPress={() => setViewMode("list")}
                colors={colors}
              />
              <SegBtn
                label="Grade"
                icon="grid"
                active={viewMode === "grid"}
                onPress={() => setViewMode("grid")}
                colors={colors}
              />
            </View>
          </View>
        </Section>

        <Section title="Sobre" colors={colors}>
          <View
            style={[
              styles.box,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
              Meus Filmes — organize sua lista de filmes para assistir, já vistos
              e os que você desistiu. Buscas em português via TMDB.
            </Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function SegBtn({
  label,
  icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segBtn,
        {
          backgroundColor: active ? colors.primary : "transparent",
          borderRadius: colors.radius - 2,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather
        name={icon}
        size={15}
        color={active ? colors.primaryForeground : colors.foreground}
      />
      <Text
        style={[
          styles.segText,
          { color: active ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  box: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  userBox: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  userHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  userName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  syncText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loginBox: {
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loginTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  loginBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  primaryBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  loginFinePrint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  segmented: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    backgroundColor: "transparent",
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  segText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  aboutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
