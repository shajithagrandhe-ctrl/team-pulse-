import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "../theme";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { Button, ErrorMessage, Heading, Loading, Screen } from "../components/ui";
import { Realtime } from "../features/Realtime";

function Routes() {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  if (auth.error) return <Screen><Heading>Connection Unavailable</Heading><ErrorMessage message={auth.error} />
    <Button title="Retry" onPress={() => { void auth.restore(); }} /></Screen>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={!auth.user}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!auth.user}>
      <Stack.Screen name="home" />
      <Stack.Screen name="account" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="crm" />
      <Stack.Screen name="admin" />
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 }, mutations: { retry: false } }
  }));
  return <SafeAreaProvider><QueryClientProvider client={queryClient}>
    <StatusBar style="light" />
    <AuthProvider><Realtime /><Routes /></AuthProvider>
  </QueryClientProvider></SafeAreaProvider>;
}
