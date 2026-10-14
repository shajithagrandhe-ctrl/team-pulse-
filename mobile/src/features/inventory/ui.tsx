import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Circle, ChevronRight, type LucideIcon } from "lucide-react-native";
import { theme } from "../../theme";
import type { Plot } from "./contracts";

export const statusColors = {
  AVAILABLE: theme.colors.available,
  ADVANCE: theme.colors.advance,
  SOLD: theme.colors.sold
} satisfies Record<Plot["status"], string>;

const statusLabels = { AVAILABLE: "Available", ADVANCE: "Advance", SOLD: "Sold" } satisfies Record<Plot["status"], string>;

export function StatusBadge({ status }: { status: Plot["status"] }) {
  const tone = status === "AVAILABLE" ? styles.statusAvailable : status === "ADVANCE" ? styles.statusAdvance : styles.statusSold;
  return <View accessibilityLabel={`Plot status: ${statusLabels[status]}`} style={[styles.status, tone]}>
    <Circle size={8} color={statusColors[status]} fill={statusColors[status]} />
    <Text style={[styles.statusText, { color: statusColors[status] }]}>{statusLabels[status]}</Text>
  </View>;
}

export function Utility({ title, icon: Icon, onPress, busy = false, destructive = false }: {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
  busy?: boolean;
  destructive?: boolean;
}) {
  const tint = destructive ? theme.colors.danger : theme.colors.primary;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: busy, busy }}
    disabled={busy}
    onPress={onPress}
    style={({ pressed }) => [styles.action, destructive && styles.actionDestructive, (pressed || busy) && styles.pressed]}
  >
    <View style={[styles.actionIcon, destructive && styles.actionIconDestructive]}>
      {busy ? <ActivityIndicator color={tint} size="small" /> : <Icon size={19} color={tint} />}
    </View>
    <Text style={[styles.label, destructive && styles.labelDestructive]}>{title}</Text>
    {!busy ? <ChevronRight size={18} color={destructive ? theme.colors.danger : theme.colors.subtle} /> : null}
  </Pressable>;
}

export function InventoryPanel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function InventoryHero({ icon: Icon, eyebrow, title, subtitle, aside }: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return <View style={styles.hero}>
    <View style={styles.heroTop}>
      <View style={styles.heroIcon}><Icon size={22} color={theme.colors.white} /></View>
      {aside}
    </View>
    <View style={styles.heroCopy}>
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>;
}

export function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon?: LucideIcon }) {
  return <View style={styles.metric}>
    <View style={styles.metricHeading}>{Icon ? <Icon size={16} color={theme.colors.primary} /> : null}<Text style={styles.metricLabel}>{label}</Text></View>
    <Text selectable style={styles.metricValue}>{String(value)}</Text>
  </View>;
}

export function InlineNotice({ children, tone = "info" }: PropsWithChildren<{ tone?: "info" | "success" | "warning" }>) {
  return <View accessibilityRole={tone === "success" ? "alert" : undefined} style={[styles.notice, styles[`notice_${tone}`]]}>
    <Text style={[styles.noticeText, styles[`noticeText_${tone}`]]}>{children}</Text>
  </View>;
}

const styles = StyleSheet.create({
  status: { alignSelf: "flex-start", minHeight: 28, flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.lg, borderWidth: 1 },
  statusAvailable: { backgroundColor: theme.colors.successSurface, borderColor: "#B8DEC8" },
  statusAdvance: { backgroundColor: theme.colors.warningSurface, borderColor: "#EDD39A" },
  statusSold: { backgroundColor: theme.colors.dangerSurface, borderColor: "#F2C7CC" },
  statusText: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  action: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface },
  actionDestructive: { borderColor: "#F2C7CC", backgroundColor: theme.colors.dangerSurface },
  actionIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md, backgroundColor: theme.colors.infoSurface },
  actionIconDestructive: { backgroundColor: "#F9DDE1" },
  label: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700", flex: 1 },
  labelDestructive: { color: theme.colors.danger },
  pressed: { opacity: 0.62 },
  panel: { padding: 16, gap: 12, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, ...theme.shadow },
  hero: { minHeight: 172, padding: 18, justifyContent: "space-between", gap: 24, borderRadius: theme.radius.lg, backgroundColor: theme.colors.navigation, borderBottomWidth: 3, borderBottomColor: theme.colors.accent, overflow: "hidden" },
  heroTop: { minHeight: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  heroIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.navigationAlt, borderWidth: 1, borderColor: "#315A83" },
  heroCopy: { gap: 5 },
  heroEyebrow: { color: "#8BB5FF", fontSize: 11, lineHeight: 16, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { color: theme.colors.white, fontSize: 24, lineHeight: 30, fontWeight: "800" },
  heroSubtitle: { color: "#C8D7E7", fontSize: 14, lineHeight: 21 },
  metric: { minWidth: "46%", flexGrow: 1, gap: 7, padding: 13, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  metricHeading: { flexDirection: "row", alignItems: "center", gap: 7 },
  metricLabel: { flex: 1, color: theme.colors.muted, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  metricValue: { color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  notice: { padding: 12, borderRadius: theme.radius.lg, borderWidth: 1 },
  notice_info: { backgroundColor: theme.colors.infoSurface, borderColor: "#C6D9FF" },
  notice_success: { backgroundColor: theme.colors.successSurface, borderColor: "#B8DEC8" },
  notice_warning: { backgroundColor: theme.colors.warningSurface, borderColor: "#EDD39A" },
  noticeText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  noticeText_info: { color: theme.colors.primaryDark },
  noticeText_success: { color: theme.colors.available },
  noticeText_warning: { color: theme.colors.advance }
});
