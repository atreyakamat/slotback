import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SessionProvider, useSession } from "@/lib/session";
import { useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Navigator() {
  const { state } = useSession();
  const t = useTheme();
  useEffect(() => {
    if (state.status !== "loading") SplashScreen.hideAsync().catch(() => undefined);
  }, [state.status]);
  if (state.status === "loading") return null;
  const signedIn = state.status === "signedIn";

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Protected guard={signedIn} redirectTo="/connect">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="campaign/[id]" options={{ title: "Opening" }} />
          <Stack.Screen name="refill/[id]" options={{ title: "Cancel and refill", presentation: "modal" }} />
          <Stack.Screen name="waitlist-new" options={{ title: "Add to waitlist", presentation: "modal" }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="connect" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <Navigator />
    </SessionProvider>
  );
}
