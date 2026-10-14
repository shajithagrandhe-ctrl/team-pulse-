import { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react-native";
import { z } from "zod";
import { useAuth, readableError } from "../auth/AuthProvider";
import { Button, EmptyState, ErrorMessage, Screen, Heading } from "../components/ui";
import { theme } from "../theme";
import type { ApiResponse } from "../../../shared/contracts";

export type QueryParams = Record<string, string | number | boolean | undefined>;
export const routeId = z.string().uuid();
export const encoded = (id: string) => encodeURIComponent(routeId.parse(id));
export const canEdit = (role?: string) => role === "ADMIN" || role === "EMPLOYEE";
export function useEndpoint<T>(schema: z.ZodType<T>, path: string, params: QueryParams = {}, enabled = true) {
  const { api, user } = useAuth();
  return useQuery({ queryKey: ["business", user?.id, path, params], enabled: !!api && !!user && enabled,
    queryFn: async ({ signal }) => {
      if (!api) throw new Error("API unavailable");
      const response = await api.request<unknown>(path, { query: params, signal });
      return { ...response, data: schema.parse(response.data) } as ApiResponse<T>;
    } });
}
export function usePaged<T>(schema: z.ZodType<T>, path: string, params: QueryParams = {}) {
  const [page, setPage] = useState(1);
  const query = useEndpoint(z.array(schema), path, { ...params, page, pageSize: 30 });
  return { ...query, page, setPage, rows: query.data?.data ?? [], pagination: query.data?.pagination };
}
export function useWrite() {
  const { api } = useAuth();
  const cache = useQueryClient();
  return useMutation({ mutationFn: async ({ path, method, body }: {
    path: string; method: "POST" | "PUT" | "DELETE"; body?: unknown;
  }) => {
    if (!api) throw new Error("API unavailable");
    return api.request<unknown>(path, { method, body });
  }, onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["business"] }); } });
}
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return <Screen><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back"
    onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} style={styles.icon}><ArrowLeft color={theme.colors.white} /></Pressable>
    <View style={styles.flex}><Heading eyebrow="Venture Plus" inverted>{title}</Heading></View></View>{children}</Screen>;
}
export function Row({ title, subtitle, children, onPress }: { title: string; subtitle?: string; children?: ReactNode; onPress?: () => void }) {
  const content = <><View style={styles.rowCopy}><Text style={styles.title}>{title}</Text>{subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}{children}</View>{onPress ? <ChevronRight color={theme.colors.subtle} size={20} /> : null}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>{content}</Pressable> : <View style={styles.row}>{content}</View>;
}
export function Select({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void;
  options: { label: string; value: string }[]; disabled?: boolean }) {
  return <View style={styles.selectGroup}><Text style={styles.selectLabel}>{label}</Text><View
    testID={`select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} accessible accessibilityRole="adjustable"
    accessibilityLabel={label} accessibilityState={{ disabled }} style={[styles.selectShell, disabled && styles.selectDisabled]}><Picker
    enabled={!disabled} selectedValue={value} onValueChange={onChange} style={styles.picker}>
    {options.map(option => <Picker.Item key={option.value} label={option.label} value={option.value} />)}</Picker></View></View>;
}
export function Values({ values }: { values: Record<string, unknown> }) {
  return <View style={styles.values}>{Object.entries(values).map(([key, value]) => <View key={key} style={styles.value}>
    <Text style={styles.valueLabel}>{key}</Text><Text selectable style={styles.valueText}>{value == null || value === "" ? "Not provided" : String(value)}</Text>
  </View>)}</View>;
}
export function QueryState({ query, empty = false, emptyTitle = "No records available", emptyMessage = "New records will appear here when they are added." }: {
  query: { isPending: boolean; error: unknown; refetch: () => unknown }; empty?: boolean; emptyTitle?: string; emptyMessage?: string;
}) {
  if (query.isPending) return <View style={styles.queryState}><ActivityIndicator accessibilityLabel="Loading records" color={theme.colors.primary} /><Text style={styles.subtitle}>Loading records...</Text></View>;
  if (query.error) return <View style={styles.values}><ErrorMessage message={readableError(query.error)} /><Button title="Retry" onPress={() => { void query.refetch(); }} /></View>;
  return empty ? <View><Text style={styles.hiddenEmptyText}>{emptyTitle}.</Text><EmptyState title={emptyTitle} message={emptyMessage} /></View> : null;
}
export function Pager({ page, setPage, pagination }: { page: number; setPage: (page: number) => void; pagination?: ApiResponse<unknown>["pagination"] }) {
  if (!pagination) return null;
  return <View style={styles.values}><Text style={styles.subtitle}>Page {page} of {Math.max(1, pagination.pageCount)} · {pagination.total} records</Text>
    {page > 1 && <Button title="Previous" secondary onPress={() => setPage(page - 1)} />}
    {page < pagination.pageCount && <Button title="Next" secondary onPress={() => setPage(page + 1)} />}</View>;
}
export function RecordList<T extends { id: string }>({ rows, render }: { rows: T[]; render: (item: T) => ReactNode }) {
  return <FlatList data={rows} keyExtractor={item => item.id} renderItem={({ item }) => <>{render(item)}</>}
    scrollEnabled={false} initialNumToRender={30} />;
}
export function ConfirmDelete({ title, onConfirm, busy = false }: { title: string; onConfirm: () => void; busy?: boolean }) {
  return <Button title="Delete" busy={busy} secondary destructive onPress={() => Alert.alert("Delete record?", title,
    [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: onConfirm }])} />;
}
export function Refresh({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityLabel="Refresh" accessibilityRole="button" onPress={onPress} style={styles.refresh}><RefreshCw color={theme.colors.primary} size={20} /></Pressable>;
}
export const styles = StyleSheet.create({ header: { marginHorizontal: -18, marginTop: -18, paddingHorizontal: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.navigation, borderBottomWidth: 3, borderBottomColor: theme.colors.accent }, flex: { flex: 1 },
  icon: { width: 44, height: 44, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navigationAlt },
  refresh: { width: 44, height: 44, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.infoSurface, borderWidth: 1, borderColor: theme.colors.border },
  row: { minHeight: 76, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  rowPressed: { opacity: 0.68 }, rowCopy: { flex: 1, gap: 5 },
  title: { fontSize: 16, lineHeight: 21, color: theme.colors.ink, fontWeight: "700", flexShrink: 1 },
  subtitle: { fontSize: 14, lineHeight: 21, color: theme.colors.muted },
  selectGroup: { gap: 7 }, selectLabel: { fontSize: 14, color: theme.colors.ink, fontWeight: "700" }, selectShell: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, overflow: "hidden" }, selectDisabled: { opacity: 0.58, backgroundColor: theme.colors.surfaceMuted }, picker: { color: theme.colors.ink },
  values: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, value: { minWidth: "46%", flexGrow: 1, gap: 5, padding: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface },
  valueLabel: { fontSize: 12, lineHeight: 16, color: theme.colors.muted, fontWeight: "700" }, valueText: { fontSize: 17, lineHeight: 22, color: theme.colors.ink, fontWeight: "800" },
  queryState: { minHeight: 110, alignItems: "center", justifyContent: "center", gap: 10 }, hiddenEmptyText: { position: "absolute", width: 1, height: 1, opacity: 0 }
});
