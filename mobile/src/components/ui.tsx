import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { AlertCircle, Inbox } from "lucide-react-native";
import { theme } from "../theme";

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.scroller} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function Heading({ children, eyebrow, subtitle, inverted = false }: PropsWithChildren<{ eyebrow?: string; subtitle?: string; inverted?: boolean }>) {
  return <View style={styles.headingGroup}>
    {eyebrow ? <Text style={[styles.eyebrow, inverted && styles.eyebrowInverted]}>{eyebrow}</Text> : null}
    <Text accessibilityRole="header" style={[styles.heading, inverted && styles.headingInverted]}>{children}</Text>
    {subtitle ? <Text style={[styles.subtitle, inverted && styles.subtitleInverted]}>{subtitle}</Text> : null}
  </View>;
}

export function Section({ title, action, children }: PropsWithChildren<{ title?: string; action?: ReactNode }>) {
  return <View style={styles.section}>
    {title || action ? <View style={styles.sectionHeader}>{title ? <Text style={styles.sectionTitle}>{title}</Text> : <View />}{action}</View> : null}
    {children}
  </View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ErrorMessage({ message }: { message?: string | null }) {
  return message ? <View accessibilityRole="alert" style={styles.errorBox}>
    <AlertCircle color={theme.colors.danger} size={18} />
    <Text style={styles.error}>{message}</Text>
  </View> : null;
}

export function Button({ title, onPress, busy = false, secondary = false, destructive = false, icon: Icon, disabled = false }: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  destructive?: boolean;
  icon?: LucideIcon;
  disabled?: boolean;
}) {
  const inactive = busy || disabled;
  const tint = secondary ? (destructive ? theme.colors.danger : theme.colors.primary) : theme.colors.white;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: inactive, busy }}
    disabled={inactive}
    onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, destructive && styles.destructive, (pressed || inactive) && styles.pressed]}
  >
    {busy ? <ActivityIndicator color={tint} /> : <>{Icon ? <Icon color={tint} size={19} /> : null}<Text style={[styles.buttonText, secondary && styles.secondaryText, destructive && styles.destructiveText]}>{title}</Text></>}
  </Pressable>;
}

export function Field({ label, error, hint, leading: Leading, trailing, ...props }: TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  leading?: LucideIcon;
  trailing?: ReactNode;
}) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputShell, error && styles.invalid, !props.editable && props.editable !== undefined && styles.inputDisabled]}>
      {Leading ? <Leading color={theme.colors.muted} size={19} /> : null}
      <TextInput accessibilityLabel={label} placeholderTextColor={theme.colors.subtle} {...props}
        nativeID={props.nativeID ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
        style={[styles.input, props.multiline && styles.multiline, props.style]} />
      {trailing}
    </View>
    {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
  </View>;
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "info" | "success" | "warning" | "danger" }) {
  return <View style={[styles.pill, styles[`pill_${tone}`]]}><Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{label}</Text></View>;
}

export function EmptyState({ title = "No records yet", message }: { title?: string; message?: string }) {
  return <View style={styles.empty}><Inbox color={theme.colors.subtle} size={28} /><Text style={styles.emptyTitle}>{title}</Text>{message ? <Text style={styles.subtitle}>{message}</Text> : null}</View>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary} accessibilityLabel={label} /><Text style={styles.loadingText}>{label}</Text></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.navigation },
  keyboard: { flex: 1 },
  scroller: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 36 },
  content: { width: "100%", maxWidth: 680, alignSelf: "center", gap: 18 },
  headingGroup: { gap: 4 },
  eyebrow: { color: theme.colors.primary, fontSize: 12, lineHeight: 17, fontWeight: "800", textTransform: "uppercase" },
  eyebrowInverted: { color: "#8BB5FF" },
  heading: { fontSize: 25, lineHeight: 31, fontWeight: "800", color: theme.colors.ink },
  headingInverted: { color: theme.colors.white },
  subtitle: { fontSize: 14, lineHeight: 21, color: theme.colors.muted },
  subtitleInverted: { color: "#C8D7E7" },
  section: { gap: 12 },
  sectionHeader: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, gap: 12, ...theme.shadow },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: theme.radius.md, backgroundColor: theme.colors.dangerSurface, borderWidth: 1, borderColor: "#F2C7CC" },
  error: { color: theme.colors.danger, fontSize: 14, lineHeight: 20, flex: 1, fontWeight: "600" },
  field: { gap: 7 },
  label: { fontSize: 14, lineHeight: 19, color: theme.colors.ink, fontWeight: "700" },
  inputShell: { minHeight: 50, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface },
  input: { flex: 1, minHeight: 48, paddingVertical: 11, fontSize: 16, color: theme.colors.ink },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  invalid: { borderColor: theme.colors.danger, backgroundColor: "#FFF9F9" },
  inputDisabled: { opacity: 0.58 },
  hint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  fieldError: { color: theme.colors.danger, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  button: { minHeight: 50, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg },
  buttonText: { fontSize: 15, lineHeight: 20, fontWeight: "800", color: theme.colors.white, textAlign: "center", flexShrink: 1 },
  secondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong },
  secondaryText: { color: theme.colors.primary },
  destructive: { backgroundColor: theme.colors.dangerSurface, borderColor: "#F2C7CC" },
  destructiveText: { color: theme.colors.danger },
  pressed: { opacity: 0.62 },
  pill: { alignSelf: "flex-start", minHeight: 26, paddingHorizontal: 9, paddingVertical: 4, borderRadius: theme.radius.sm, justifyContent: "center", backgroundColor: theme.colors.surfaceMuted },
  pillText: { color: theme.colors.muted, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  pill_neutral: { backgroundColor: theme.colors.surfaceMuted },
  pill_info: { backgroundColor: theme.colors.infoSurface },
  pill_success: { backgroundColor: theme.colors.successSurface },
  pill_warning: { backgroundColor: theme.colors.warningSurface },
  pill_danger: { backgroundColor: theme.colors.dangerSurface },
  pillText_neutral: { color: theme.colors.muted },
  pillText_info: { color: theme.colors.primaryDark },
  pillText_success: { color: theme.colors.available },
  pillText_warning: { color: theme.colors.advance },
  pillText_danger: { color: theme.colors.danger },
  empty: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.borderStrong, borderRadius: theme.radius.lg, padding: 24, backgroundColor: theme.colors.surface },
  emptyTitle: { fontSize: 16, lineHeight: 21, fontWeight: "800", color: theme.colors.ink },
  loading: { flex: 1, gap: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.muted, fontSize: 14, fontWeight: "600" }
});
