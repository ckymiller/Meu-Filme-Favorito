import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { usePreferences } from "@/lib/preferences";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { viewMode, toggleViewMode } = usePreferences();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const headerRight = () => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 12 }}>
      <Pressable
        onPress={toggleViewMode}
        hitSlop={10}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 999,
          opacity: pressed ? 0.6 : 1,
        })}
        accessibilityLabel={
          viewMode === "list" ? "Mudar para grade" : "Mudar para lista"
        }
      >
        <Feather
          name={viewMode === "list" ? "grid" : "list"}
          size={20}
          color={colors.foreground}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push("/settings")}
        hitSlop={10}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 999,
          opacity: pressed ? 0.6 : 1,
        })}
        accessibilityLabel="Configurações"
      >
        <Feather name="user" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
        },
        headerShadowVisible: false,
        headerRight,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Quero Ver",
          tabBarIcon: ({ color }) => (
            <Feather name="bookmark" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="watched"
        options={{
          title: "Já Vi",
          tabBarIcon: ({ color }) => (
            <Feather name="check-circle" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="abandoned"
        options={{
          title: "Desisti",
          tabBarIcon: ({ color }) => (
            <Feather name="x-circle" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
