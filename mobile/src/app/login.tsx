import { useState } from "react";
import { Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react-native";
import { readableError, useAuth } from "../auth/AuthProvider";
import { Button, Card, ErrorMessage, Field } from "../components/ui";
import { theme } from "../theme";

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(6, "Enter your password"), adminCode: z.string().optional() });
type Values = z.infer<typeof schema>;
type Portal = "EMPLOYEE" | "ADMIN" | "CUSTOMER" | "AGENT";
const portals = [
  { value: "EMPLOYEE" as const, label: "Employee", icon: BriefcaseBusiness },
  { value: "ADMIN" as const, label: "Admin", icon: ShieldCheck },
  { value: "CUSTOMER" as const, label: "Customer", icon: UsersRound },
  { value: "AGENT" as const, label: "Agent", icon: UserRound }
];

export default function Login() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [portal, setPortal] = useState<Portal>("EMPLOYEE");
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", adminCode: "" }
  });
  const submit = handleSubmit(async (values) => {
    setError(null);
    try { await auth.login({ ...values, adminCode: values.adminCode || undefined, expectedRole: portal }); }
    catch (failure) { setError(readableError(failure)); }
  });
  const selected = portals.find(item => item.value === portal) ?? portals[0];
  const SelectedIcon = selected.icon;
  return <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ImageBackground source={require("../../assets/plot-bg.jpg")} resizeMode="cover" style={styles.fill} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={styles.logoFrame}><Image source={require("../../assets/app-logo.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="Venture Plus" /></View>
          <View style={styles.brandCopy}><Text style={styles.brandName}>Venture Plus</Text><Text style={styles.brandSub}>Real estate management</Text></View>
        </View>
        <View style={styles.intro}><Text style={styles.kicker}>SECURE ACCESS</Text><Text style={styles.hero}>Welcome back</Text><Text style={styles.heroCopy}>Sign in to manage ventures, customers, teams, and field activity.</Text></View>
        <Card style={styles.formCard}>
          <View style={styles.formHeading}><Text style={styles.formTitle}>Choose your portal</Text><Text style={styles.formSubtitle}>Use the same credentials as the website.</Text></View>
          <View accessibilityRole="tablist" style={styles.portalGrid}>
            {portals.map(({ value, label, icon: Icon }) => {
              const active = portal === value;
              return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`${label} portal`}
                onPress={() => { setPortal(value); setError(null); }} style={({ pressed }) => [styles.portal, active && styles.portalActive, pressed && styles.pressed]}>
                <Icon size={18} color={active ? theme.colors.white : theme.colors.muted} />
                <Text style={[styles.portalText, active && styles.portalTextActive]}>{label}</Text>
              </Pressable>;
            })}
          </View>
          <View style={styles.portalIntro}><View style={styles.portalIcon}><SelectedIcon size={24} color={theme.colors.primary} /></View><View style={styles.portalCopy}><Text style={styles.portalTitle}>{selected.label} portal</Text><Text style={styles.portalHint}>Access your authorized workspace and records.</Text></View></View>
          <Controller control={control} name="email" render={({ field, fieldState }) => <Field label="Email address" placeholder="name@estatehub.com" leading={Mail}
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} autoCapitalize="none" keyboardType="email-address"
            autoComplete="email" textContentType="emailAddress" editable={!isSubmitting} />} />
          <Controller control={control} name="password" render={({ field, fieldState }) => <Field label="Password" placeholder="Enter your password" leading={LockKeyhole}
            trailing={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword(value => !value)} style={styles.eye}>
              {showPassword ? <EyeOff color={theme.colors.muted} size={20} /> : <Eye color={theme.colors.muted} size={20} />}
            </Pressable>} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} secureTextEntry={!showPassword}
            autoCapitalize="none" autoComplete="current-password" textContentType="password" editable={!isSubmitting} />} />
          {portal === "ADMIN" ? <Controller control={control} name="adminCode" render={({ field }) => <Field label="Admin code" hint="Optional unless your administrator requires it."
            value={field.value} onChangeText={field.onChange} secureTextEntry autoCapitalize="none" editable={!isSubmitting} />} /> : null}
          <ErrorMessage message={error} />
          <Button title={`Sign in as ${selected.label}`} icon={selected.icon} onPress={() => { void submit(); }} busy={isSubmitting} />
          <Text style={styles.security}>Your session is stored securely on this device.</Text>
        </Card>
      </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.navigation }, fill: { flex: 1 }, backgroundImage: { opacity: 0.18 }, overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(16,42,76,0.88)" },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 36 },
  brand: { maxWidth: 560, width: "100%", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 12 },
  logoFrame: { width: 50, height: 50, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: "#5F7FA4", backgroundColor: theme.colors.navigationAlt, padding: 5 },
  logo: { width: "100%", height: "100%" }, brandCopy: { gap: 1 }, brandName: { color: theme.colors.white, fontSize: 22, lineHeight: 27, fontWeight: "800" },
  brandSub: { color: "#BED0E4", fontSize: 13, lineHeight: 18 },
  intro: { maxWidth: 560, width: "100%", alignSelf: "center", paddingTop: 34, paddingBottom: 24, gap: 8 },
  kicker: { color: "#78A9FF", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  hero: { color: theme.colors.white, fontSize: 34, lineHeight: 40, fontWeight: "800" },
  heroCopy: { color: "#C8D7E7", fontSize: 16, lineHeight: 24, maxWidth: 460 },
  formCard: { maxWidth: 560, width: "100%", alignSelf: "center", padding: 18, gap: 18, shadowOpacity: 0.16 },
  formHeading: { gap: 4 }, formTitle: { color: theme.colors.ink, fontSize: 21, lineHeight: 27, fontWeight: "800" }, formSubtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  portalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  portal: { minHeight: 44, minWidth: "47%", flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 10, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted },
  portalActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, portalText: { color: theme.colors.muted, fontSize: 14, fontWeight: "700" }, portalTextActive: { color: theme.colors.white },
  portalIntro: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: theme.colors.infoSurface, borderRadius: theme.radius.lg },
  portalIcon: { width: 42, height: 42, borderRadius: theme.radius.md, backgroundColor: theme.colors.white, alignItems: "center", justifyContent: "center" }, portalCopy: { flex: 1, gap: 2 },
  portalTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" }, portalHint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  eye: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 }, security: { color: theme.colors.muted, textAlign: "center", fontSize: 12, lineHeight: 17 }, pressed: { opacity: 0.68 }
});
