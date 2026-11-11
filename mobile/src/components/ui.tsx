import * as Haptics from "expo-haptics";
import { type ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text as RNText,
  type TextProps,
  View,
  type ViewStyle,
} from "react-native";
import { radius, space, type Theme, useTheme } from "@/theme";

type Tone = "text" | "muted" | "danger" | "success" | "onHighlight" | "onPrimary";

export function Text({ tone = "text", variant = "body", style, ...props }: TextProps & { tone?: Tone; variant?: "display" | "title" | "body" | "small" | "label" }) {
  const t = useTheme();
  return <RNText {...props} style={[styles[variant], { color: t[tone] }, style]} />;
}

/** A scrolling screen with pull-to-refresh and the app's padding. */
export function Screen({ children, refreshing, onRefresh }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(12) }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.muted} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, tone = "surface" }: { children: ReactNode; style?: ViewStyle; tone?: "surface" | "highlight" | "primary" }) {
  const t = useTheme();
  const bg = tone === "highlight" ? t.highlight : tone === "primary" ? t.primary : t.surface;
  return (
    <FadeIn>
      <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: space(4), borderWidth: tone === "surface" ? 1 : 0, borderColor: t.border }, style]}>
        {children}
      </View>
    </FadeIn>
  );
}

/** Rises in gently the first time it appears. */
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 320, delay, useNativeDriver: true }).start();
  }, [v, delay]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>{children}</Animated.View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "highlight" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const t = useTheme();
  const colors = buttonColors(t, variant);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.bg, borderColor: colors.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {loading ? <ActivityIndicator color={colors.fg} /> : icon}
      <RNText style={[styles.buttonLabel, { color: colors.fg }]}>{label}</RNText>
    </Pressable>
  );
}

function buttonColors(t: Theme, variant: string) {
  switch (variant) {
    case "highlight":
      return { bg: t.highlight, fg: t.onHighlight, border: t.highlight };
    case "secondary":
      return { bg: t.surface, fg: t.text, border: t.border };
    case "ghost":
      return { bg: "transparent", fg: t.text, border: "transparent" };
    case "danger":
      return { bg: "transparent", fg: t.danger, border: t.border };
    default:
      return { bg: t.primary, fg: t.onPrimary, border: t.primary };
  }
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={[styles.chip, { backgroundColor: selected ? t.primary : t.surface, borderColor: selected ? t.primary : t.border }]}
    >
      <RNText style={{ color: selected ? t.onPrimary : t.text, fontSize: 15, fontWeight: "500" }}>{label}</RNText>
    </Pressable>
  );
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: "muted" | "success" | "warning" | "danger" | "highlight" }) {
  const t = useTheme();
  const bg = tone === "highlight" ? t.highlight : t.raised;
  const fg = tone === "highlight" ? t.onHighlight : tone === "muted" ? t.muted : t[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <RNText style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{label}</RNText>
    </View>
  );
}

/** A softly pulsing dot for anything live. */
export function PulseDot({ color }: { color?: string }) {
  const t = useTheme();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  const c = color ?? t.success;
  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: c,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: space(3) }, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: space(3) }} />;
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.bg, padding: space(10) }}>
      <ActivityIndicator color={t.muted} />
    </View>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <View accessibilityRole="alert" style={{ borderRadius: radius.md, padding: space(4), backgroundColor: t.raised, gap: space(3) }}>
      <Text tone="danger">{message}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 38 },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
  },
  buttonLabel: { fontSize: 16, fontWeight: "700" },
  chip: { paddingHorizontal: space(4), paddingVertical: space(2), borderRadius: radius.pill, borderWidth: 1, minHeight: 40, justifyContent: "center" },
  badge: { paddingHorizontal: space(2), paddingVertical: 3, borderRadius: radius.sm, alignSelf: "flex-start" },
});
