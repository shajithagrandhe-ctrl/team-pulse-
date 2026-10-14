import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react-native";
import { readableError, useAuth } from "../auth/AuthProvider";
import { Button, Card, ErrorMessage, Field, Section } from "../components/ui";
import { Page } from "../features/common";
import { roleTone, theme } from "../theme";

const schema = z.object({ currentPassword: z.string().min(6, "Enter your current password"), newPassword: z.string().min(8, "Use at least 8 characters") });
type Values = z.infer<typeof schema>;
export default function Account() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "" } });
  const changePassword = handleSubmit(async (values) => {
    setError(null);
    try {
      if (!auth.api) throw new Error("API unavailable");
      await auth.api.request("/auth/change-password", { method: "POST", body: values });
      await auth.clear();
    } catch (failure) { setError(readableError(failure)); }
  });
  const logout = async () => {
    setLoggingOut(true); setError(null);
    try { await auth.logout(); } catch (failure) { setError(readableError(failure)); }
    finally { setLoggingOut(false); }
  };
  const tone = auth.user ? roleTone[auth.user.role] : roleTone.CUSTOMER;
  return <Page title="Account and security">
    <Card style={styles.identity}>
      <View style={styles.avatar}><UserRound color={theme.colors.primary} size={28} /></View>
      <View style={styles.identityCopy}><Text style={styles.name}>{auth.user?.fullName || auth.user?.displayName}</Text>
        <View style={styles.detail}><Mail color={theme.colors.muted} size={15} /><Text selectable style={styles.text}>{auth.user?.email}</Text></View>
        <View style={[styles.role, { backgroundColor: tone.background }]}><ShieldCheck color={tone.foreground} size={14} /><Text style={[styles.roleText, { color: tone.foreground }]}>{auth.user?.role}</Text></View>
      </View>
    </Card>
    <Section title="Change password">
      <Card>
        <Text style={styles.help}>Choose a strong password you do not use elsewhere. Changing it will sign you out on this device.</Text>
        <Controller control={control} name="currentPassword" render={({ field, fieldState }) => <Field label="Current password" leading={KeyRound} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
          error={fieldState.error?.message} secureTextEntry autoCapitalize="none" autoComplete="current-password" editable={!isSubmitting && !loggingOut} />} />
        <Controller control={control} name="newPassword" render={({ field, fieldState }) => <Field label="New password" leading={KeyRound} hint="Use at least 8 characters." value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
          error={fieldState.error?.message} secureTextEntry autoCapitalize="none" autoComplete="new-password" editable={!isSubmitting && !loggingOut} />} />
        <ErrorMessage message={error} />
        <Button title="Update password" icon={ShieldCheck} onPress={() => { void changePassword(); }} busy={isSubmitting || loggingOut} />
      </Card>
    </Section>
    <Section title="Session">
      <Button title="Sign out" icon={LogOut} onPress={() => { void logout(); }} busy={loggingOut || isSubmitting} secondary />
    </Section>
  </Page>;
}
const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 14 }, avatar: { width: 58, height: 58, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.infoSurface }, identityCopy: { flex: 1, gap: 6 },
  name: { fontSize: 19, lineHeight: 24, color: theme.colors.ink, fontWeight: "800" }, text: { fontSize: 14, lineHeight: 20, color: theme.colors.muted, flex: 1 }, detail: { flexDirection: "row", alignItems: "center", gap: 6 },
  role: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm }, roleText: { fontSize: 11, fontWeight: "800" }, help: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 }
});
