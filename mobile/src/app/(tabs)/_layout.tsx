import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useTheme } from "@/theme";

type IconName = keyof typeof Feather.glyphMap;

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Feather name={icon} color={color as string} size={size - 2} />,
});

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800" },
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.muted,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab("Today", "sun")} />
      <Tabs.Screen name="schedule" options={tab("Schedule", "calendar")} />
      <Tabs.Screen name="waitlist" options={tab("Waitlist", "users")} />
      <Tabs.Screen name="more" options={tab("More", "settings")} />
    </Tabs>
  );
}
