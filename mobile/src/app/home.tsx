import { router, type Href } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Building2, Users, Heart, UserRound, MapPin, ContactRound, Shield, type LucideIcon,
  ChevronRight, LayoutDashboard, TrendingUp, CircleDollarSign
} from "lucide-react-native";
import { z } from "zod";
import { Card, Heading, Pill, Screen, Section } from "../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { QueryState, Refresh, useEndpoint } from "../features/common";
import { roleTone, theme } from "../theme";

const statsSchema = z.object({ locations: z.number(), plots: z.number(), employees: z.number(), customers: z.number(), leads: z.number(),
  plotsByStatus: z.object({ available: z.number(), advance: z.number(), sold: z.number() }) });

function Nav({ title, subtitle, href, icon: Icon, tone = "blue" }: { title: string; subtitle: string; href: Href; icon: LucideIcon; tone?: "blue" | "teal" | "gold" }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(href)}
    style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
    <View style={[styles.navIcon, tone === "teal" && styles.navIconTeal, tone === "gold" && styles.navIconGold]}><Icon color={tone === "teal" ? theme.colors.teal : tone === "gold" ? theme.colors.advance : theme.colors.primary} size={22} /></View>
    <View style={styles.navCopy}><Text style={styles.navTitle}>{title}</Text><Text style={styles.navSubtitle}>{subtitle}</Text></View>
    <ChevronRight color={theme.colors.subtle} size={20} />
  </Pressable>;
}

function Metric({ label, value, color = theme.colors.white }: { label: string; value: number; color?: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value.toLocaleString()}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export default function Home() {
  const { user } = useAuth();
  const operational = user?.role === "ADMIN" || user?.role === "EMPLOYEE";
  const stats = useEndpoint(statsSchema, "/stats", {}, operational);
  if (!user) return null;
  const tone = roleTone[user.role] ?? roleTone.CUSTOMER;
  return <Screen>
    <View style={styles.hero}>
      <View style={styles.brandRow}><View style={styles.brand}><Image source={require("../../assets/app-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="Venture Plus" />
        <View><Text style={styles.brandName}>Venture Plus</Text><Text style={styles.brandSub}>Operations workspace</Text></View></View>
        <Refresh onPress={() => { void stats.refetch(); }} />
      </View>
      <View style={styles.greeting}><Heading eyebrow="Dashboard" subtitle="Your live workspace for properties and customer activity." inverted>Good to see you, {user.displayName || user.fullName}</Heading>
        <View style={[styles.rolePill, { backgroundColor: tone.background }]}><Text style={[styles.roleText, { color: tone.foreground }]}>{user.role}</Text></View>
      </View>
      {operational ? <><QueryState query={stats} />{stats.data ? <View style={styles.metrics}>
        <Metric label="Total plots" value={stats.data.data.plots} />
        <Metric label="Available" value={stats.data.data.plotsByStatus.available} color="#73D6A2" />
        <Metric label="Advance" value={stats.data.data.plotsByStatus.advance} color="#FFD27A" />
        <Metric label="Sold" value={stats.data.data.plotsByStatus.sold} color="#FF9BA4" />
      </View> : null}</> : <View style={styles.customerMessage}><LayoutDashboard color="#8BB5FF" size={22} /><Text style={styles.customerMessageText}>Browse your property activity and reach the right team from one place.</Text></View>}
    </View>

    <Section title="Property operations">
      <Nav title={user.role === "CUSTOMER" ? "Property inventory" : "Inventory"} subtitle="Ventures, plots and availability" href="/inventory" icon={Building2} />
      <Nav title="Saved properties" subtitle="Review your shortlisted plots" href="/inventory/favorites" icon={Heart} tone="gold" />
      <Nav title="Agents" subtitle="Find the right property contact" href="/inventory/agents" icon={ContactRound} tone="teal" />
    </Section>

    <Section title="Customer operations">
      <Nav title="CRM workspace" subtitle="All customer, lead, tracking, and reporting tools" href="/crm" icon={LayoutDashboard} tone="gold" />
      <Nav title={user.role === "AGENT" ? "Assigned leads" : "Leads"} subtitle="Follow enquiries and next actions" href="/crm/leads" icon={TrendingUp} />
      <Nav title="Customer records" subtitle="Contacts, budgets and booking status" href="/crm/customers" icon={Users} tone="teal" />
      <Nav title="Tracking updates" subtitle="Review location and field updates" href="/crm/tracking" icon={MapPin} tone="gold" />
    </Section>

    {(operational || user.role === "ADMIN") ? <Section title="Administration">
      {operational ? <Nav title="User directories" subtitle="Admins, employees and customers" href="/admin/directories" icon={Users} /> : null}
      {user.role === "ADMIN" ? <Nav title="Employee access" subtitle="Permissions, assignments and status" href="/admin" icon={Shield} tone="gold" /> : null}
    </Section> : null}

    <Section title="Account">
      <Nav title="Profile and security" subtitle={user.email} href="/account" icon={UserRound} tone="teal" />
    </Section>
    {operational && stats.data ? <Card style={styles.summary}><View style={styles.summaryIcon}><CircleDollarSign color={theme.colors.advance} size={22} /></View><View style={styles.navCopy}><Text style={styles.navTitle}>Pipeline snapshot</Text><Text style={styles.navSubtitle}>{stats.data.data.leads} leads · {stats.data.data.customers} customer records</Text></View><Pill label="Live" tone="success" /></Card> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: -18, marginTop: -18, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 22, gap: 20, backgroundColor: theme.colors.navigation, borderBottomWidth: 3, borderBottomColor: theme.colors.accent },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, brand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logo: { width: 44, height: 44, borderRadius: theme.radius.md }, brandName: { color: theme.colors.white, fontSize: 18, lineHeight: 22, fontWeight: "800" }, brandSub: { color: "#BFD0E1", fontSize: 12, lineHeight: 17 },
  greeting: { gap: 12 }, rolePill: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: theme.radius.sm }, roleText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, metric: { minWidth: "47%", flexGrow: 1, padding: 12, gap: 3, backgroundColor: theme.colors.navigationAlt, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: "#31567D" },
  metricValue: { fontSize: 23, lineHeight: 28, fontWeight: "800" }, metricLabel: { color: "#C7D6E5", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  customerMessage: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, backgroundColor: theme.colors.navigationAlt, borderRadius: theme.radius.lg }, customerMessageText: { flex: 1, color: "#D4E0EC", fontSize: 14, lineHeight: 20 },
  nav: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, padding: 13, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, ...theme.shadow },
  navIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md, backgroundColor: theme.colors.infoSurface }, navIconTeal: { backgroundColor: "#E5F6F4" }, navIconGold: { backgroundColor: theme.colors.warningSurface },
  navCopy: { flex: 1, gap: 3 }, navTitle: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" }, navSubtitle: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  summary: { flexDirection: "row", alignItems: "center" }, summaryIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md, backgroundColor: theme.colors.warningSurface }, pressed: { opacity: 0.68 }
});
