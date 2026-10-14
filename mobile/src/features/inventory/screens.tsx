import { useState } from "react";
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import {
  BadgeCheck, Bookmark, Building2, CheckCircle2, ChevronRight, ExternalLink, FileText, Heart,
  ImageIcon, Layers3, Mail, Map, MapPin, MessageSquare, Pencil, Phone, Plus, Search, Send,
  Trash2, Upload, UserRound, Users
} from "lucide-react-native";
import { useAuth } from "../../auth/AuthProvider";
import { Button, Card, ErrorMessage, Field, Pill, Section } from "../../components/ui";
import { theme } from "../../theme";
import { Page, Select, Values, QueryState, Pager, RecordList, useEndpoint, usePaged, useWrite, encoded, canEdit } from "../common";
import { agentSchema, assetUrl, createSchema, favoriteSchema, filterSchema, idSchema, inquirySchema, locationSchema, plotEditSchema, plotLeadSchema, plotSchema, statusSchema, validationMessage, ventureSchema, type Plot } from "./contracts";
import { InlineNotice, InventoryHero, InventoryPanel, Metric, StatusBadge, Utility } from "./ui";

export function InventoryGate({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <Page title="Inventory"><Text style={styles.supporting}>Restoring session...</Text></Page>;
  if (!user) return <Redirect href="/login" />;
  if (admin && user.role !== "ADMIN") return <Page title="Inventory"><ErrorMessage message="Administrator access required." /></Page>;
  return <>{children}</>;
}

export function IdRoute({ children }: { children: (id: string) => React.ReactNode }) {
  const { id } = useLocalSearchParams();
  const parsed = idSchema.safeParse(id);
  return <InventoryGate>{parsed.success ? children(parsed.data) : <Page title="Inventory"><ErrorMessage message="Invalid record ID." /></Page>}</InventoryGate>;
}

const go = (path: string) => router.push(path as Parameters<typeof router.push>[0]);

export function InventoryIndex() {
  const q = useEndpoint(z.array(locationSchema), "/locations");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const locations = q.data?.data ?? [];
  const visibleLocations = [...locations].filter(location => location.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => sort === "availability"
      ? (right.availablePlots ?? 0) - (left.availablePlots ?? 0)
      : left.name.localeCompare(right.name));
  const available = locations.reduce((total, location) => total + (location.availablePlots ?? 0), 0);
  return <Page title="Inventory">
    <InventoryHero icon={Building2} eyebrow="Property portfolio" title="Find the right plot" subtitle="Browse real inventory by location, venture and live availability." aside={<Pill label={available + " available"} tone="success" />} />
    <View style={styles.actionGrid}>
      <QuickAction icon={Bookmark} title="Saved plots" subtitle="Your shortlist" onPress={() => go("/inventory/favorites")} />
      <QuickAction icon={Users} title="Agents" subtitle="Get expert help" onPress={() => go("/inventory/agents")} />
    </View>
    {user?.role === "ADMIN" ? <Button icon={Plus} title="Create venture" onPress={() => go("/inventory/create")} /> : null}
    <Section title="Locations">
      <InventoryPanel>
        <Field label="Search locations" leading={Search} value={search} onChangeText={setSearch} placeholder="Location name" />
        <Select label="Sort locations" value={sort} onChange={setSort} options={[{ label: "Name", value: "name" }, { label: "Most availability", value: "availability" }]} />
      </InventoryPanel>
      <QueryState query={q} empty={!locations.length} />
      {!q.isPending && !q.error && locations.length > 0 && !visibleLocations.length ? <InlineNotice>No locations match your search.</InlineNotice> : null}
      {visibleLocations.map(location => <LocationCard key={location.id} name={location.name} available={location.availablePlots ?? 0} ventureCount={location.ventures.length} onPress={() => go("/inventory/locations/" + encoded(location.id))} />)}
    </Section>
  </Page>;
}

function QuickAction({ icon: Icon, title, subtitle, onPress }: { icon: typeof Bookmark; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
    <View style={styles.quickIcon}><Icon size={21} color={theme.colors.primary} /></View>
    <Text style={styles.quickTitle}>{title}</Text>
    <Text style={styles.quickSubtitle}>{subtitle}</Text>
  </Pressable>;
}

function LocationCard({ name, available, ventureCount, onPress }: { name: string; available: number; ventureCount: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}>
    <View style={styles.locationIcon}><MapPin size={22} color={theme.colors.white} /></View>
    <View style={styles.flex}>
      <Text style={styles.cardKicker}>LOCATION</Text><Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardMeta}>{ventureCount + (ventureCount === 1 ? " venture" : " ventures")}</Text>
    </View>
    <View style={styles.trailing}><Pill label={available + " open"} tone={available ? "success" : "neutral"} /><ChevronRight size={19} color={theme.colors.subtle} /></View>
  </Pressable>;
}

export function Locations({ id }: { id: string }) {
  const q = useEndpoint(z.array(ventureSchema), "/ventures", { locationId: idSchema.parse(id) });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const ventures = q.data?.data ?? [];
  const visibleVentures = [...ventures].filter(venture => venture.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => sort === "plots"
      ? (right.plots?.length ?? 0) - (left.plots?.length ?? 0)
      : left.name.localeCompare(right.name));
  return <Page title="Ventures">
    <InventoryHero icon={Layers3} eyebrow="Inventory" title="Venture collection" subtitle="Open a venture to review media, plots and availability." aside={<Pill label={ventures.length + " total"} tone="info" />} />
    <InventoryPanel>
      <Field label="Search ventures" leading={Search} value={search} onChangeText={setSearch} placeholder="Venture name" />
      <Select label="Sort ventures" value={sort} onChange={setSort} options={[{ label: "Name", value: "name" }, { label: "Most plots", value: "plots" }]} />
    </InventoryPanel>
    <QueryState query={q} empty={!ventures.length} />
    {!q.isPending && !q.error && ventures.length > 0 && !visibleVentures.length ? <InlineNotice>No ventures match your search.</InlineNotice> : null}
    {visibleVentures.map(venture => <Pressable key={venture.id} accessibilityRole="button" accessibilityLabel={venture.name} onPress={() => go("/inventory/ventures/" + encoded(venture.id))} style={({ pressed }) => [styles.ventureCard, pressed && styles.pressed]}>
      <Media source={venture.layoutImage} compact />
      <View style={styles.ventureCopy}><Text style={styles.cardKicker}>{venture.location?.name ?? "VENTURE"}</Text><View style={styles.titleRow}><Text style={styles.ventureTitle}>{venture.name}</Text><ChevronRight size={20} color={theme.colors.subtle} /></View><Text style={styles.cardMeta}>View plots, layout and availability</Text></View>
    </Pressable>)}
  </Page>;
}

export function Media({ source, compact = false }: { source?: string | null; compact?: boolean }) {
  const url = assetUrl(source);
  const [failedUrl, fail] = useState<string>();
  const failed = failedUrl === url;
  if (!url) return <View style={[styles.mediaFallback, compact && styles.mediaCompact]}><ImageIcon size={28} color={theme.colors.subtle} /><Text style={styles.mediaFallbackText}>No media available</Text></View>;
  if (/\.(pdf|svg)(?:\?|$)/i.test(url)) return <View style={styles.documentSurface}>
    <View style={styles.documentIcon}><FileText size={24} color={theme.colors.primary} /></View>
    <View style={styles.flex}><Text style={styles.documentTitle}>Venture document</Text><Text style={styles.cardMeta}>Open the original file</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open document" onPress={() => { void Linking.openURL(url).catch(() => fail(url)); }} style={styles.openIcon}><ExternalLink size={19} color={theme.colors.primary} /></Pressable>
    <ErrorMessage message={failed ? "Unable to open document." : null} />
  </View>;
  return failed
    ? <View style={[styles.mediaFallback, compact && styles.mediaCompact]}><ImageIcon size={28} color={theme.colors.subtle} /><Text style={styles.mediaFallbackText}>Media unavailable</Text></View>
    : <Image accessibilityLabel="Venture media" source={{ uri: url }} resizeMode="cover" style={[styles.media, compact && styles.mediaCompact]} onError={() => fail(url)} />;
}

export function PlotRow({ plot }: { plot: Plot }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={"Open plot " + plot.plotNumber} onPress={() => go("/inventory/plots/" + encoded(plot.id))} style={({ pressed }) => [styles.plotCard, pressed && styles.pressed]}>
    <View style={styles.plotMarker}><Map size={21} color={theme.colors.primary} /></View>
    <View style={styles.flex}><View style={styles.titleRow}><Text style={styles.cardTitle}>{plot.plotNumber}</Text><StatusBadge status={plot.status} /></View><Text style={styles.cardMeta}>{plot.area} sq yd</Text><Text style={styles.priceText}>{plot.pricePerSqYard} <Text style={styles.priceUnit}>per sq yd</Text></Text></View>
    <ChevronRight size={19} color={theme.colors.subtle} />
  </Pressable>;
}

export function VentureDetail({ id }: { id: string }) {
  const q = useEndpoint(ventureSchema, "/ventures/" + encoded(id));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const plots = usePaged(plotSchema, "/plots", filterSchema.parse({ ventureId: id, status: status || undefined }));
  const visiblePlots = plots.rows.filter(plot => plot.plotNumber.toLowerCase().includes(search.trim().toLowerCase()));
  return <Page title={q.data?.data.name ?? "Venture"}>
    <QueryState query={q} />
    {q.data ? <>
      <InventoryHero icon={Building2} eyebrow={q.data.data.location?.name ?? "Venture"} title={q.data.data.name} subtitle="Live plot inventory and venture layout." />
      <Media source={q.data.data.layoutImage} />
      <Button icon={Map} title="View interactive layout" onPress={() => go("/inventory/layout/" + encoded(id))} />
      {user?.role === "ADMIN" ? <Section title="Venture asset"><MediaUpload id={id} blocked={!!q.error} /></Section> : null}
    </> : null}
    <Section title="Plots">
      <InventoryPanel>
        <Select label="Plot status" value={status} onChange={next => { setStatus(next); plots.setPage(1); }} options={[{ label: "All statuses", value: "" }, ...statusSchema.options.map(option => ({ label: option[0] + option.slice(1).toLowerCase(), value: option }))]} />
        <Field label="Find on this page" leading={Search} value={search} onChangeText={setSearch} placeholder="Search by plot number" />
      </InventoryPanel>
      <QueryState query={plots} empty={!plots.rows.length} />
      {!plots.isPending && !plots.error && plots.rows.length > 0 && !visiblePlots.length ? <InlineNotice>No plots on this page match your search.</InlineNotice> : null}
      <RecordList rows={visiblePlots} render={plot => <PlotRow plot={plot} />} />
      <Pager {...plots} />
    </Section>
  </Page>;
}

export function PlotDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const operational = canEdit(user?.role);
  const q = useEndpoint(plotSchema, "/plots/" + encoded(id));
  const saved = useEndpoint(z.array(favoriteSchema), "/favorites");
  const leads = useEndpoint(z.array(plotLeadSchema), "/plots/" + encoded(id) + "/leads", {}, operational);
  const write = useWrite();
  const [error, setError] = useState("");
  const favorite = saved.data?.data.some(item => item.plotId === id);
  return <Page title={q.data?.data.plotNumber ?? "Plot"}>
    <QueryState query={q} />
    {q.data ? <>
      <InventoryHero icon={Map} eyebrow={q.data.data.venture?.name ?? "Plot details"} title={q.data.data.plotNumber} subtitle={q.data.data.venture?.location?.name} aside={<StatusBadge status={q.data.data.status} />} />
      <View style={styles.metricGrid}>
        <Metric icon={Map} label="Area" value={q.data.data.area + " sq yd"} />
        <Metric icon={BadgeCheck} label="Price / sq yd" value={q.data.data.pricePerSqYard} />
      </View>
      <Media source={q.data.data.venture?.layoutImage} />
      <QueryState query={saved} />
      <Utility icon={Heart} title={favorite ? "Remove from saved" : "Save plot"} busy={write.isPending || !saved.data || !!saved.error || !!q.error} onPress={() => { void (async () => {
        try {
          setError("");
          await write.mutateAsync(favorite ? { path: "/favorites/" + encoded(id), method: "DELETE" } : { path: "/favorites", method: "POST", body: { plotId: idSchema.parse(id) } });
        } catch (caught) { setError(validationMessage(caught)); }
      })(); }} />
      <View style={styles.actionGrid}>
        <QuickAction icon={Users} title="Find agent" subtitle="Call or email" onPress={() => go("/inventory/agents?plotId=" + encoded(id))} />
        <QuickAction icon={MessageSquare} title="Send inquiry" subtitle="Ask about this plot" onPress={() => go("/inventory/inquiry?plotId=" + encoded(id))} />
      </View>
      <Button icon={Map} title="View venture layout" secondary onPress={() => go("/inventory/layout/" + encoded(q.data.data.ventureId))} />
      {canEdit(user?.role) ? <PlotEdit key={id} plot={q.data.data} blocked={!!q.error} /> : null}
      {operational ? <Section title="Associated leads">
        <QueryState query={leads} empty={!leads.data?.data.length} />
        {leads.data?.data.map(lead => <InventoryPanel key={lead.id}>
          <View style={styles.titleRow}><View style={styles.leadAvatar}><UserRound size={19} color={theme.colors.primary} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{lead.customerName}</Text>{lead.status ? <Pill label={lead.status} tone="info" /> : null}</View></View>
          <Values values={{ Email: lead.email, Contact: lead.contactNumber, Location: lead.location, "Unique ID": lead.uniqueId, Notes: lead.notes }} />
        </InventoryPanel>)}
      </Section> : null}
    </> : null}
    <ErrorMessage message={error} />
  </Page>;
}

function PlotEdit({ plot, blocked }: { plot: Plot; blocked: boolean }) {
  const [form, setForm] = useState({ plotNumber: plot.plotNumber, status: plot.status as string, area: String(plot.area), pricePerSqYard: String(plot.pricePerSqYard) });
  const [message, setMessage] = useState("");
  const write = useWrite();
  return <Section title="Edit plot"><InventoryPanel>
    <View style={styles.sectionIntro}><View style={styles.sectionIcon}><Pencil size={18} color={theme.colors.primary} /></View><Text style={[styles.supporting, styles.flex]}>Update this plot, its inventory details, and live status.</Text></View>
    {(["plotNumber", "area", "pricePerSqYard"] as const).map(key => <Field key={key} label={{ plotNumber: "Plot number", area: "Area (sq yd)", pricePerSqYard: "Price per sq yd" }[key]} value={form[key]} keyboardType={key === "plotNumber" ? "default" : "numeric"} onChangeText={value => setForm({ ...form, [key]: value })} />)}
    <Select label="Status" value={form.status} onChange={status => setForm({ ...form, status })} options={statusSchema.options.map(option => ({ label: option[0] + option.slice(1).toLowerCase(), value: option }))} />
    <Button title="Save plot changes" busy={write.isPending || blocked} onPress={() => { void (async () => {
      try {
        setMessage("");
        await write.mutateAsync({ path: "/plots/" + encoded(plot.id), method: "PUT", body: plotEditSchema.parse(form) });
        setMessage("Plot saved.");
      } catch (caught) { setMessage(validationMessage(caught)); }
    })(); }} />
    {message ? <InlineNotice tone={message === "Plot saved." ? "success" : "warning"}>{message}</InlineNotice> : null}
  </InventoryPanel></Section>;
}

export function Favorites() {
  const q = useEndpoint(z.array(favoriteSchema), "/favorites");
  const write = useWrite();
  const favorites = q.data?.data ?? [];
  return <Page title="Saved plots">
    <InventoryHero icon={Bookmark} eyebrow="Shortlist" title="Saved plots" subtitle="Keep promising plots close while you compare your options." aside={<Pill label={favorites.length + " saved"} tone="info" />} />
    <QueryState query={q} empty={!favorites.length} />
    <ErrorMessage message={write.error ? validationMessage(write.error) : null} />
    {favorites.map(favorite => <View key={favorite.id} style={styles.favoriteGroup}>
      <PlotRow plot={favorite.plot} />
      <Utility icon={Trash2} destructive title={"Remove " + favorite.plot.plotNumber} busy={write.isPending || !!q.error} onPress={() => write.mutate({ path: "/favorites/" + encoded(favorite.plotId), method: "DELETE" })} />
    </View>)}
  </Page>;
}

export function Agents({ id }: { id?: string }) {
  const { plotId } = useLocalSearchParams();
  const context = plotId === undefined ? undefined : idSchema.safeParse(plotId);
  const validContext = context?.success ? context.data : undefined;
  const list = useEndpoint(z.array(agentSchema), "/agents", {}, !id);
  const detail = useEndpoint(agentSchema, id ? "/agents/" + encoded(id) : "/agents", {}, !!id);
  const rows = id ? detail.data ? [detail.data.data] : [] : list.data?.data ?? [];
  return <Page title={id ? "Agent" : "Agents"}>
    {!id ? <InventoryHero icon={Users} eyebrow="Venture Plus team" title="Property agents" subtitle="Connect with a specialist for property and plot guidance." aside={<Pill label={rows.length + " listed"} tone="info" />} /> : null}
    <QueryState query={id ? detail : list} empty={!rows.length} />
    {context && !context.success ? <ErrorMessage message="Invalid plot reference." /> : null}
    {rows.map(agent => id
      ? <InventoryPanel key={agent.id}>
          <View style={styles.agentHeader}><View style={styles.agentAvatar}><UserRound size={30} color={theme.colors.white} /></View><View style={styles.flex}><Text style={styles.agentName}>{agent.fullName || agent.displayName}</Text><Text style={styles.cardMeta}>{[agent.position, agent.department].filter(Boolean).join(" | ") || "Property specialist"}</Text></View></View>
          <Media source={agent.agentProfile?.photoUrl} compact />
          {agent.agentProfile?.bio ? <Text style={styles.body}>{agent.agentProfile.bio}</Text> : null}
          <Values values={{ Email: agent.email, Phone: agent.phoneNumber || agent.agentProfile?.phone, License: agent.agentProfile?.licenseNumber }} />
          <Contact title="Email agent" url={"mailto:" + agent.email} />
          {agent.phoneNumber || agent.agentProfile?.phone ? <Contact title="Call agent" url={"tel:" + (agent.phoneNumber || agent.agentProfile?.phone || "").replace(/[^+\d]/g, "")} /> : null}
          <Button icon={Send} title="Send inquiry" onPress={() => go("/inventory/inquiry?agentId=" + encoded(agent.id) + (validContext ? "&plotId=" + encoded(validContext) : ""))} />
        </InventoryPanel>
      : <Pressable key={agent.id} accessibilityRole="button" accessibilityLabel={agent.fullName || agent.displayName} onPress={() => go("/inventory/agents/" + encoded(agent.id) + (validContext ? "?plotId=" + encoded(validContext) : ""))} style={({ pressed }) => [styles.agentRow, pressed && styles.pressed]}>
          <View style={styles.agentListAvatar}><UserRound size={22} color={theme.colors.primary} /></View>
          <View style={styles.flex}><Text style={styles.cardTitle}>{agent.fullName || agent.displayName}</Text><Text style={styles.cardMeta}>{[agent.position, agent.department].filter(Boolean).join(" | ") || "Property specialist"}</Text></View>
          <ChevronRight size={19} color={theme.colors.subtle} />
        </Pressable>)}
  </Page>;
}

function Contact({ title, url }: { title: string; url: string }) {
  const [error, setError] = useState("");
  return <><Utility icon={url.startsWith("tel:") ? Phone : Mail} title={title} onPress={() => { void Linking.openURL(url).catch(() => setError("No application available for this contact method.")); }} /><ErrorMessage message={error} /></>;
}

export function Inquiry() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const refs = z.object({ plotId: idSchema.optional(), agentId: idSchema.optional() }).safeParse({ plotId: params.plotId, agentId: params.agentId });
  const [form, setForm] = useState({ customerName: user?.fullName ?? "", customerEmail: user?.email ?? "", customerPhone: "", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const write = useWrite();
  return <Page title="Inquiry">
    <InventoryHero icon={MessageSquare} eyebrow="Property assistance" title="Send an inquiry" subtitle="Share your contact details and question with the Venture Plus team." />
    {!refs.success ? <ErrorMessage message="Invalid inquiry reference." /> : sent
      ? <Card style={styles.successCard}><View style={styles.successIcon}><CheckCircle2 size={28} color={theme.colors.available} /></View><Text style={styles.successTitle}>Inquiry submitted</Text><Text style={styles.supporting}>The team has received your message.</Text></Card>
      : <InventoryPanel>
          {Object.entries(form).map(([key, value]) => <Field key={key} label={{ customerName: "Name", customerEmail: "Email", customerPhone: "Phone (optional)", message: "Message" }[key] ?? key} value={value} multiline={key === "message"} keyboardType={key === "customerEmail" ? "email-address" : key === "customerPhone" ? "phone-pad" : "default"} autoCapitalize={key === "customerEmail" ? "none" : "sentences"} onChangeText={next => setForm({ ...form, [key]: next })} />)}
          <ErrorMessage message={error} />
          <Button icon={Send} title="Submit inquiry" busy={write.isPending} onPress={() => { void (async () => {
            try {
              setError("");
              await write.mutateAsync({ path: "/inquiries", method: "POST", body: inquirySchema.parse({ ...form, ...refs.data }) });
              setSent(true);
            } catch (caught) { setError(validationMessage(caught)); }
          })(); }} />
        </InventoryPanel>}
  </Page>;
}

export function CreateVenture() {
  const [form, setForm] = useState({ name: "", locationName: "", plotCount: "1", plotNumberPrefix: "Plot ", startingPlotNumber: "1", defaultArea: "", defaultPricePerSqYard: "" });
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string>();
  const write = useWrite();
  const labels = { name: "Venture name", locationName: "Location name", plotCount: "Plot count (1-200)", plotNumberPrefix: "Plot number prefix", startingPlotNumber: "Starting number", defaultArea: "Default area (sq yd)", defaultPricePerSqYard: "Default price per sq yd" };
  return <Page title="Create venture">
    <InventoryHero icon={Plus} eyebrow="Administrator" title="New venture" subtitle="Create the venture and its initial plot inventory in one step." />
    {created ? <Card style={styles.successCard}>
      <View style={styles.successIcon}><CheckCircle2 size={28} color={theme.colors.available} /></View>
      <Text style={styles.successTitle}>Venture created</Text>
      <Text style={styles.supporting}>Add the real venture photo or layout before opening the record.</Text>
      <MediaUpload id={created} />
      <Button title="Open venture" onPress={() => go("/inventory/ventures/" + encoded(created))} />
    </Card> : <InventoryPanel>
      {Object.entries(form).map(([key, value]) => <Field key={key} label={labels[key as keyof typeof labels]} value={value} keyboardType={["name", "locationName", "plotNumberPrefix"].includes(key) ? "default" : "numeric"} onChangeText={next => setForm({ ...form, [key]: next })} />)}
      <Button icon={Plus} title="Create venture" busy={write.isPending} onPress={() => { void (async () => {
        try {
          setError("");
          const result = await write.mutateAsync({ path: "/ventures", method: "POST", body: createSchema.parse(form) });
          setCreated(ventureSchema.parse(result.data).id);
        } catch (caught) { setError(validationMessage(caught)); }
      })(); }} />
    </InventoryPanel>}
    <ErrorMessage message={error} />
  </Page>;
}

function MediaUpload({ id, blocked = false }: { id: string; blocked?: boolean }) {
  const write = useWrite();
  const [message, setMessage] = useState("");
  const pick = async (kind: "layout" | "photo") => {
    try {
      const types = kind === "layout" ? ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/svg+xml"] : ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      const result = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const file = result.assets[0];
      const mime = file.mimeType ?? "";
      const extensions: Record<string, string[]> = { "application/pdf": ["pdf"], "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/jpg": ["jpg", "jpeg"], "image/svg+xml": ["svg"], "image/webp": ["webp"] };
      if (!types.includes(mime) || !extensions[mime]?.includes(file.name.split(".").pop()?.toLowerCase() ?? "") || file.size === undefined || file.size > (kind === "layout" ? 20 : 10) * 1024 * 1024) throw new Error("Unsupported file type or file too large (layout 20 MB, photo 10 MB).");
      const body = new FormData();
      if (Platform.OS === "web" && file.file) body.append(kind, file.file, file.name);
      else body.append(kind, { uri: file.uri, name: file.name, type: mime } as unknown as Blob);
      setMessage("");
      await write.mutateAsync({ path: "/ventures/" + encoded(id) + "/" + kind, method: "POST", body });
      setMessage((kind === "layout" ? "Layout" : "Photo") + " uploaded.");
    } catch (caught) { setMessage(validationMessage(caught)); }
  };
  return <InventoryPanel style={styles.uploadPanel}>
    <View style={styles.sectionIntro}><View style={styles.sectionIcon}><Upload size={18} color={theme.colors.primary} /></View><View style={styles.flex}><Text style={styles.cardTitle}>Upload venture media</Text><Text style={styles.supporting}>Photo and layout share one stored asset. Uploading replaces the current asset.</Text></View></View>
    {(["layout", "photo"] as const).map(kind => <Utility key={kind} icon={kind === "layout" ? FileText : ImageIcon} title={"Upload " + kind} busy={write.isPending || blocked} onPress={() => Alert.alert("Replace venture asset?", "The current photo or layout will be replaced.", [{ text: "Cancel", style: "cancel" }, { text: "Choose file", onPress: () => { void pick(kind); } }])} />)}
    {message ? <InlineNotice tone={message.endsWith("uploaded.") ? "success" : "warning"}>{message}</InlineNotice> : null}
  </InventoryPanel>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  supporting: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  body: { color: theme.colors.ink, fontSize: 14, lineHeight: 22 },
  pressed: { opacity: 0.65 },
  actionGrid: { flexDirection: "row", gap: 10 },
  quickAction: { flex: 1, minWidth: 0, minHeight: 126, padding: 14, gap: 6, justifyContent: "flex-end", borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  quickIcon: { width: 40, height: 40, marginBottom: 8, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  quickTitle: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  quickSubtitle: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  locationCard: { minHeight: 94, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  locationIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.navigation },
  trailing: { alignItems: "flex-end", gap: 10 },
  cardKicker: { color: theme.colors.primary, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  cardTitle: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800", flexShrink: 1 },
  cardMeta: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  ventureCard: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  ventureCopy: { padding: 15, gap: 5 },
  ventureTitle: { flex: 1, color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  media: { width: "100%", height: 230, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted },
  mediaCompact: { height: 154, borderRadius: 0 },
  mediaFallback: { width: "100%", height: 190, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderStyle: "dashed", borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted },
  mediaFallbackText: { color: theme.colors.muted, fontSize: 13, fontWeight: "600" },
  documentSurface: { minHeight: 76, padding: 12, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 11, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface },
  documentIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  documentTitle: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  openIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  plotCard: { minHeight: 100, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  plotMarker: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  priceText: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  priceUnit: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  leadAvatar: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  sectionIntro: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  sectionIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  favoriteGroup: { gap: 8 },
  agentRow: { minHeight: 82, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  agentListAvatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.infoSurface },
  agentHeader: { flexDirection: "row", alignItems: "center", gap: 13 },
  agentAvatar: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.navigation },
  agentName: { color: theme.colors.ink, fontSize: 21, lineHeight: 27, fontWeight: "800" },
  successCard: { alignItems: "center" },
  successIcon: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, backgroundColor: theme.colors.successSurface },
  successTitle: { color: theme.colors.ink, fontSize: 19, lineHeight: 25, fontWeight: "800" },
  uploadPanel: { shadowOpacity: 0 }
});
