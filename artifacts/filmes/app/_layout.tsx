import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  setAuthTokenGetter,
  setBaseUrl,
} from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setMovieActionsHandlers } from "@/components/MovieActions";
import { MoviesProvider, useMovies } from "@/contexts/MoviesContext";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PreferencesProvider } from "@/lib/preferences";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

function ApiAuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return <>{children}</>;
}

function MovieActionsBridge({ children }: { children: React.ReactNode }) {
  const { updateStatus, removeMovie } = useMovies();
  useEffect(() => {
    setMovieActionsHandlers({ updateStatus, removeMovie });
  }, [updateStatus, removeMovie]);
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ presentation: "modal", title: "Adicionar filme" }}
      />
      <Stack.Screen
        name="settings"
        options={{ presentation: "modal", title: "Configurações" }}
      />
      <Stack.Screen name="movie/[id]" options={{ title: "" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ApiAuthBridge>
              <PreferencesProvider>
                <MoviesProvider>
                  <MovieActionsBridge>
                    <GestureHandlerRootView>
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </MovieActionsBridge>
                </MoviesProvider>
              </PreferencesProvider>
            </ApiAuthBridge>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
