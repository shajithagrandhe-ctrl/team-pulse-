import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { z } from "zod";
import { useAuth, readableError } from "../../auth/AuthProvider";
import { Button, Card, ErrorMessage, Field, Pill } from "../../components/ui";
import { Page, Select } from "../common";
import { theme } from "../../theme";
import { editor, finiteNumber, label, reader, trackingEditor } from "./contracts";

export const message = (error: unknown) => error instanceof Error && !(error instanceof z.ZodError) && error.name !== "ApiError"
  ? error.message : readableError(error);

export function Access({ children, permission = "read" }: { children: ReactNode; permission?: "read" | "write" | "tracking" }) {
  const { user } = useAuth();
  const allowed = permission === "write" ? editor(user?.role) : permission === "tracking" ? trackingEditor(user?.role) : reader(user?.role);
  return allowed ? <>{children}</> : <Page title="CRM"><ErrorMessage message="You do not have permission to access this screen." /></Page>;
}

export function CrmHero({ icon: Icon, title, description, meta }: {
  icon: LucideIcon; title: string; description: string; meta?: string;
}) {
  return <View style={styles.hero}>
    <View style={styles.heroIcon}><Icon size={23} color={theme.colors.accent} /></View>
    <View style={styles.heroCopy}>
      {meta ? <Text style={styles.heroMeta}>{meta}</Text> : null}
      <Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroDescription}>{description}</Text>
    </View>
  </View>;
}

export function Panel({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return <View style={styles.panel}>
    <View style={styles.panelHeader}>
      <Text accessibilityRole="header" style={styles.panelTitle}>{title}</Text>
      {caption ? <Text style={styles.panelCaption}>{caption}</Text> : null}
    </View>
    <View style={styles.panelBody}>{children}</View>
  </View>;
}

export function Action({ icon: Icon, title, subtitle, onPress, busy = false }: {
  icon: LucideIcon; title: string; subtitle?: string; onPress: () => void; busy?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={subtitle}
    accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={onPress}
    style={({ pressed }) => [styles.action, (pressed || busy) && styles.actionPressed]}>
    <View style={styles.actionIcon}><Icon size={20} color={theme.colors.primary} /></View>
    <View style={styles.actionCopy}>
      <Text style={styles.actionText}>{busy ? "Working..." : title}</Text>
      {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={19} color={theme.colors.subtle} />
  </Pressable>;
}

const statusTones: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  NEW: "info", FOLLOW_UP: "warning", QUALIFIED: "success", WON: "success", LOST: "danger",
  HOT_LEAD: "danger", FOLLOWING_UP: "warning", CONFIRMED_NOT_PAID: "info", PAID_ADVANCE: "warning", BOOKED: "success",
  ACTIVE: "success", INACTIVE: "neutral", MOVING: "info"
};
export function Status({ value }: { value?: string | null }) {
  const text = value ? label(value) : "Status not provided";
  return <View accessibilityLabel={`Status: ${text}`}><Pill label={text} tone={statusTones[value ?? ""] ?? "neutral"} /></View>;
}

export const options = (values: readonly string[], all = false) => [
  ...(all ? [{ label: "All statuses", value: "" }] : []), ...values.map(value => ({ label: label(value), value }))
];

export type FormField = {
  name: string; label: string; type?: "number" | "email" | "phone" | "password" | "multiline" | "select" | "switch";
  options?: { label: string; value: string }[]; optional?: boolean; readOnly?: boolean; placeholder?: string;
};

export function Form({ fields, initial, schema, onSave, title = "Save", disabled = false, clearPassword = false }: {
  fields: FormField[]; initial: Record<string, unknown>; schema: z.ZodTypeAny;
  onSave: (body: Record<string, unknown>) => Promise<void>; title?: string; disabled?: boolean; clearPassword?: boolean;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => Object.fromEntries(fields.map(field => [field.name,
    field.type === "switch" ? initial[field.name] === true : String(initial[field.name] ?? "")])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (name: string, value: unknown) => { setValues(v => ({ ...v, [name]: value })); setErrors(v => ({ ...v, [name]: "" })); };
  const save = async () => {
    if (busy || disabled) return;
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const value = values[field.name];
      if (field.optional && value === "") continue;
      body[field.name] = field.type === "number" ? finiteNumber(String(value)) : value;
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
      setError("Check the highlighted fields."); return;
    }
    setBusy(true); setError(""); setErrors({});
    if (clearPassword) setValues(v => ({ ...v, password: "" }));
    try { await onSave(parsed.data); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  };
  return <Card style={styles.formCard}>
    <View style={styles.formHeading}>
      <Text accessibilityRole="header" style={styles.formTitle}>Record information</Text>
      <Text style={styles.formHint}>Fields marked optional can be left blank.</Text>
    </View>
    <View style={styles.form}>{fields.map(field => <View key={field.name}>
      {field.type === "select" ? <Select label={field.label} value={String(values[field.name])}
        disabled={busy || disabled || field.readOnly} onChange={value => change(field.name, value)} options={field.options ?? []} />
        : field.type === "switch" ? <View style={styles.toggle}>
          <View style={styles.toggleCopy}><Text style={styles.actionText}>{field.label}</Text><Text style={styles.actionSubtitle}>Turn this setting on or off.</Text></View>
          <Switch accessibilityLabel={field.label} accessibilityState={{ disabled: busy || disabled || field.readOnly }}
            trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }} thumbColor={theme.colors.white}
            disabled={busy || disabled || field.readOnly} value={values[field.name] === true} onValueChange={value => change(field.name, value)} />
        </View>
        : <Field label={field.label} value={String(values[field.name])} onChangeText={value => change(field.name, value)}
          editable={!busy && !disabled && !field.readOnly} error={errors[field.name]} placeholder={field.placeholder}
          secureTextEntry={field.type === "password"} autoCorrect={!['password', 'email', 'number'].includes(field.type ?? "")}
          autoCapitalize={['password', 'email', 'number'].includes(field.type ?? "") ? "none" : "sentences"}
          keyboardType={field.type === "number" ? "numbers-and-punctuation" : field.type === "email" ? "email-address" : field.type === "phone" ? "phone-pad" : "default"}
          multiline={field.type === "multiline"} textAlignVertical={field.type === "multiline" ? "top" : "auto"}
          style={field.type === "multiline" ? styles.multiline : undefined} />}
      {(field.type === "select" || field.type === "switch") && <ErrorMessage message={errors[field.name]} />}
    </View>)}</View>
    <ErrorMessage message={error} />
    <Button title={title} busy={busy} disabled={disabled} onPress={() => { void save(); }} />
  </Card>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 132, padding: 18, flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: theme.radius.lg, backgroundColor: theme.colors.navigation, borderBottomWidth: 3, borderBottomColor: theme.colors.accent, ...theme.shadow },
  heroIcon: { width: 46, height: 46, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navigationAlt },
  heroCopy: { flex: 1, gap: 4 },
  heroMeta: { color: "#9EB7D0", fontSize: 11, lineHeight: 16, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { color: theme.colors.white, fontSize: 21, lineHeight: 27, fontWeight: "800" },
  heroDescription: { color: "#C8D7E7", fontSize: 14, lineHeight: 20 },
  panel: { gap: 12 },
  panelHeader: { gap: 3 },
  panelTitle: { color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  panelCaption: { color: theme.colors.muted, fontSize: 13, lineHeight: 18 },
  panelBody: { gap: 10 },
  action: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  actionPressed: { opacity: 0.62 },
  actionIcon: { width: 42, height: 42, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.infoSurface },
  actionCopy: { flex: 1, gap: 2 },
  actionText: { fontSize: 15, lineHeight: 20, color: theme.colors.ink, fontWeight: "800", flexShrink: 1 },
  actionSubtitle: { fontSize: 12, lineHeight: 17, color: theme.colors.muted, flexShrink: 1 },
  formCard: { padding: 16, gap: 18 },
  formHeading: { gap: 3, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  formTitle: { color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  formHint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  form: { gap: 16 },
  toggle: { minHeight: 58, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted },
  toggleCopy: { flex: 1, gap: 2 },
  multiline: { minHeight: 100 }
});
