import { useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polygon, Rect, Text as SvgText, SvgAst, parse } from "react-native-svg";
import { ExternalLink, Map, Minus, Plus, Save, Trash2, Undo2 } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { Button, ErrorMessage } from "../../components/ui";
import { theme } from "../../theme";
import { Page, QueryState, Select, encoded, useEndpoint, useWrite } from "../common";
import { assetUrl, geometryBatch, normalize, polygonSchema, rectangle, regionsSchema, validationMessage, ventureSchema, type Plot, type Point, type Regions, type Venture } from "./contracts";
import { InlineNotice, InventoryHero, InventoryPanel, statusColors, Utility } from "./ui";

type Draft = { plots: Plot[]; regions: Regions; changed: string[]; regionsChanged: boolean };

export function LayoutScreen({ id }: { id: string }) {
  const q = useEndpoint(ventureSchema, "/ventures/" + encoded(id));
  return <Page title="Venture layout"><QueryState query={q} />{q.data && <LayoutEditor key={id + ":" + (q.data.data.layoutImage ?? "")} venture={q.data.data} blocked={!!q.error} />}</Page>;
}

function Icon({ label, onPress, children, disabled = false }: { label: string; onPress: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.iconButton, (pressed || disabled) && styles.iconInactive]}>{children}</Pressable>;
}

function LayoutEditor({ venture, blocked }: { venture: Venture; blocked: boolean }) {
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";
  const write = useWrite();
  const parsedRegions = regionsSchema.safeParse(venture.layoutRegions ?? { roads: [], parks: [] });
  const [draft, setDraft] = useState<Draft>(() => ({ plots: venture.plots ?? [], regions: parsedRegions.success ? parsedRegions.data : { roads: [], parks: [] }, changed: [], regionsChanged: false }));
  const [history, setHistory] = useState<Draft[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState("view");
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(1);
  const [width, setWidth] = useState(300);
  const [message, setMessage] = useState("");
  const [mediaFailed, setMediaFailed] = useState(false);
  const [svgAst, setSvgAst] = useState<ReturnType<typeof parse>>(null);
  const [regionIndex, setRegionIndex] = useState("");
  const uri = assetUrl(venture.layoutImage);
  const pdf = !!uri && /\.pdf(?:\?|$)/i.test(uri);
  const svg = !!uri && /\.svg(?:\?|$)/i.test(uri);
  const drawing = admin && mode !== "view";

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (uri && !pdf && !svg) Image.getSize(uri, (w, h) => { if (active && w > 0 && h > 0) setRatio(w / h); }, () => { if (active) setMediaFailed(true); });
    if (uri && svg) {
      const timeout = setTimeout(() => controller.abort(), 15000);
      void (async () => {
        try {
          const response = await fetch(uri, { signal: controller.signal, credentials: "omit" });
          if (!response.ok) throw new Error("SVG unavailable");
          const ast = parse(await response.text());
          if (!ast) throw new Error("Invalid SVG");
          const viewBox = typeof ast.props.viewBox === "string" ? ast.props.viewBox.trim().split(/[\s,]+/).map(Number) : [];
          const w = viewBox.length === 4 ? viewBox[2] : Number(ast.props.width);
          const h = viewBox.length === 4 ? viewBox[3] : Number(ast.props.height);
          if (active) {
            setSvgAst(ast);
            if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) setRatio(w / h);
          }
        } catch {
          if (active) setMediaFailed(true);
        } finally {
          clearTimeout(timeout);
        }
      })();
    }
    return () => { active = false; controller.abort(); };
  }, [uri, pdf, svg]);

  const change = (next: Draft) => {
    setHistory(previous => [...previous, draft]);
    setDraft(next);
  };

  const commit = () => {
    try {
      if (write.isPending || blocked) return;
      if (mode === "rectangle") {
        if (points.length !== 2 || !selected) throw new Error("Select a plot and two corners.");
        const plot = draft.plots.find(item => item.id === selected);
        if (polygonSchema.safeParse(plot?.shapeData).success) throw new Error("The server cannot clear an existing polygon. Use polygon mode for this plot.");
        const box = rectangle(points[0], points[1]);
        if (!box.width || !box.height) throw new Error("Rectangle must have a nonzero area.");
        change({ ...draft, changed: [...new Set([...draft.changed, selected])], plots: draft.plots.map(item => item.id === selected ? { ...item, ...box } : item) });
      } else {
        const polygon = polygonSchema.parse({ type: "polygon", points });
        if (mode === "polygon") {
          if (!selected) throw new Error("Select a plot.");
          change({ ...draft, changed: [...new Set([...draft.changed, selected])], plots: draft.plots.map(item => item.id === selected ? { ...item, shapeData: polygon } : item) });
        } else {
          if (!parsedRegions.success) throw new Error("Existing region data is unsupported; replacement is disabled.");
          const key = mode === "road" ? "roads" : "parks";
          const regions = regionIndex === "" ? [...draft.regions[key], { points: polygon.points }] : draft.regions[key].map((region, index) => index === Number(regionIndex) ? { ...region, points: polygon.points } : region);
          change({ ...draft, regionsChanged: true, regions: regionsSchema.parse({ ...draft.regions, [key]: regions }) });
        }
      }
      setPoints([]);
      setMessage("");
    } catch (caught) {
      setMessage(validationMessage(caught));
    }
  };

  const save = async () => {
    if (!admin || blocked || write.isPending) return;
    let next = draft;
    const results: string[] = [];
    try {
      if (draft.changed.length) {
        const body = geometryBatch(draft.plots, draft.changed);
        await write.mutateAsync({ path: "/plots/coords", method: "PUT", body });
        next = { ...next, changed: [] };
        setDraft(next);
        results.push("Plot geometry saved.");
        setHistory([]);
      }
      if (draft.regionsChanged) {
        await write.mutateAsync({ path: "/ventures/" + encoded(venture.id) + "/regions", method: "PUT", body: { regions: regionsSchema.parse(draft.regions) } });
        next = { ...next, regionsChanged: false };
        setDraft(next);
        results.push("Regions saved.");
        setHistory([]);
      }
      setMessage(results.join(" ") || "No changes to save.");
    } catch (caught) {
      setMessage([...results, validationMessage(caught), "Unsaved changes retained. Retry saving."].join(" "));
    }
  };

  const surfaceWidth = width * zoom;
  const surfaceHeight = surfaceWidth / ratio;
  const selection = draft.plots.find(plot => plot.id === selected);
  const hasChanges = draft.changed.length > 0 || draft.regionsChanged;

  return <View style={styles.screen}>
    <InventoryHero icon={Map} eyebrow={venture.location?.name ?? "Plot planning"} title={venture.name} subtitle={admin ? "Inspect, select and edit plot geometry." : "Tap an outlined plot to open its details."} />

    {pdf ? <Utility icon={ExternalLink} title="Open PDF layout" onPress={() => { if (uri) void Linking.openURL(uri).catch(error => setMessage(validationMessage(error))); }} /> : null}
    {!uri || pdf || mediaFailed ? <InlineNotice tone={mediaFailed ? "warning" : "info"}>{pdf ? "PDF overlays use a normalized drawing surface." : mediaFailed ? "Layout image unavailable." : "No layout image uploaded."}</InlineNotice> : null}
    {!parsedRegions.success ? <ErrorMessage message="Existing region data is unsupported. Region editing is disabled." /> : null}

    <InventoryPanel style={styles.toolbarPanel}>
      <View style={styles.toolbar}>
        <View style={styles.zoomGroup}>
          <Icon label="Zoom out" disabled={zoom <= 1} onPress={() => setZoom(Math.max(1, zoom - 0.5))}><Minus color={theme.colors.primary} size={20} /></Icon>
          <View style={styles.zoomReadout}><Text style={styles.zoomValue}>{Math.round(zoom * 100)}%</Text><Text style={styles.zoomLabel}>ZOOM</Text></View>
          <Icon label="Zoom in" disabled={zoom >= 4} onPress={() => setZoom(Math.min(4, zoom + 0.5))}><Plus color={theme.colors.primary} size={20} /></Icon>
        </View>
        {admin ? <View style={styles.editActions}>
          <Icon label="Undo" disabled={write.isPending || (!history.length && !points.length)} onPress={() => {
            if (points.length) setPoints(points.slice(0, -1));
            else {
              setDraft(history[history.length - 1]);
              setHistory(history.slice(0, -1));
            }
          }}><Undo2 color={theme.colors.primary} size={20} /></Icon>
          <Icon label="Save geometry" disabled={blocked || write.isPending || !hasChanges} onPress={() => { void save(); }}><Save color={theme.colors.primary} size={20} /></Icon>
        </View> : null}
      </View>
      {selection ? <View style={styles.selection}><View style={styles.flex}><Text style={styles.selectionLabel}>Selected plot</Text><Text style={styles.selectionValue}>{selection.plotNumber}</Text></View><View style={styles.statusDot} /><Text style={styles.selectionStatus}>{selection.status[0] + selection.status.slice(1).toLowerCase()}</Text></View> : null}
    </InventoryPanel>

    {admin ? <InventoryPanel>
      <Text style={styles.panelTitle}>Layout tools</Text>
      <Text style={styles.supporting}>Choose a mode, then tap the canvas to define geometry.</Text>
      <Select label="Layout mode" value={mode} onChange={next => { setMode(next); setPoints([]); setRegionIndex(""); }} options={["view", "rectangle", "polygon", "road", "park"].map(option => ({ label: option[0].toUpperCase() + option.slice(1), value: option }))} />
      <Select label="Selected plot" value={selected} onChange={value => { setSelected(value); setPoints([]); }} options={[{ label: "Choose plot", value: "" }, ...draft.plots.map(plot => ({ label: plot.plotNumber + " (" + plot.status + ")", value: plot.id }))]} />
      {mode === "road" || mode === "park" ? <>
        <Select label="Region" value={regionIndex} onChange={value => { setRegionIndex(value); setPoints([]); }} options={[{ label: "New region", value: "" }, ...draft.regions[mode === "road" ? "roads" : "parks"].map((_, index) => ({ label: (mode === "road" ? "Road " : "Park ") + (index + 1), value: String(index) }))]} />
        {regionIndex !== "" ? <Utility destructive title="Delete selected region" icon={Trash2} busy={write.isPending || blocked} onPress={() => {
          const key = mode === "road" ? "roads" : "parks";
          change({ ...draft, regionsChanged: true, regions: { ...draft.regions, [key]: draft.regions[key].filter((_, index) => index !== Number(regionIndex)) } });
          setRegionIndex("");
          setPoints([]);
        }} /> : null}
      </> : null}
    </InventoryPanel> : <InventoryPanel>
      <Text style={styles.panelTitle}>Open a plot</Text>
      <Text style={styles.supporting}>Choose a plot to open its accessible detail view.</Text>
      <Select label="Plot" value="" onChange={value => { if (value) router.push(("/inventory/plots/" + encoded(value)) as Parameters<typeof router.push>[0]); }}
        options={[{ label: "Choose plot", value: "" }, ...draft.plots.map(plot => ({ label: plot.plotNumber + " (" + plot.status + ")", value: plot.id }))]} />
    </InventoryPanel>}

    <View style={styles.canvasFrame}>
      <View style={styles.canvasHeader}><View><Text style={styles.canvasTitle}>Plot layout</Text><Text style={styles.canvasHint}>{drawing ? "Tap to add drawing points" : zoom > 1 ? "Drag to explore the layout" : "Select a plot to continue"}</Text></View><Text style={styles.plotCount}>{draft.plots.length} plots</Text></View>
      <View onLayout={event => setWidth(Math.max(1, event.nativeEvent.layout.width))} style={[styles.viewport, { height: Math.min(480, width / ratio) }]}>
        <ScrollView horizontal scrollEnabled={!drawing} nestedScrollEnabled>
          <ScrollView scrollEnabled={!drawing} nestedScrollEnabled>
            <View style={{ width: surfaceWidth, height: surfaceHeight, backgroundColor: "#EEF2F5" }}>
              {uri && !pdf && !mediaFailed && (svg ? <SvgAst ast={svgAst} override={{ width: surfaceWidth, height: surfaceHeight }} /> : <Image source={{ uri }} resizeMode="contain" style={{ position: "absolute", width: surfaceWidth, height: surfaceHeight }} onError={() => setMediaFailed(true)} />)}
              <Svg accessibilityLabel="Venture plot layout" width={surfaceWidth} height={surfaceHeight} viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.svgOverlay}>
                {(["roads", "parks"] as const).flatMap(kind => draft.regions[kind].map((region, index) => <Polygon key={kind + "-" + index} points={region.points.map(point => point.x * 100 + "," + point.y * 100).join(" ")} fill={kind === "parks" ? "#86D3A6" : "#CBD5E1"} fillOpacity={0.65} stroke={kind === "parks" ? theme.colors.available : theme.colors.muted} strokeWidth={0.3} />))}
                {draft.plots.map(plot => {
                  const polygon = polygonSchema.safeParse(plot.shapeData);
                  const x = plot.x ?? 0;
                  const y = plot.y ?? 0;
                  const onPress = () => {
                    if (drawing) return;
                    if (admin) setSelected(plot.id);
                    else router.push(("/inventory/plots/" + encoded(plot.id)) as Parameters<typeof router.push>[0]);
                  };
                  const selectedPlot = selected === plot.id;
                  const props = { fill: statusColors[plot.status], fillOpacity: selectedPlot ? 0.52 : 0.34, stroke: selectedPlot ? theme.colors.primary : statusColors[plot.status], strokeWidth: selectedPlot ? 0.9 : 0.35, onPress };
                  return <Viewless key={plot.id}>
                    {polygon.success ? <Polygon {...props} points={polygon.data.points.map(point => point.x * 100 + "," + point.y * 100).join(" ")} /> : plot.width != null && plot.height != null ? <Rect {...props} x={x * 100} y={y * 100} width={plot.width * 100} height={plot.height * 100} /> : null}
                    {polygon.success || plot.width != null ? <SvgText x={(polygon.success ? polygon.data.points[0].x : x) * 100} y={(polygon.success ? polygon.data.points[0].y : y) * 100 + 2} fontSize={2} fontWeight="700" fill={theme.colors.ink}>{plot.plotNumber}</SvgText> : null}
                  </Viewless>;
                })}
                {points.length > 2 ? <Polygon points={points.map(point => point.x * 100 + "," + point.y * 100).join(" ")} fill="#60A5FA" fillOpacity={0.3} stroke={theme.colors.primary} strokeWidth={0.4} /> : null}
                {points.map((point, index) => <Circle key={index} cx={point.x * 100} cy={point.y * 100} r={0.7} fill={theme.colors.primary} />)}
              </Svg>
              {drawing ? <View accessibilityRole="button" accessibilityLabel="Draw layout geometry" accessibilityHint="Tap to add a point" onStartShouldSetResponder={() => true} onResponderRelease={event => {
                if (write.isPending || blocked) return;
                const point = normalize(event.nativeEvent.locationX, event.nativeEvent.locationY, surfaceWidth, surfaceHeight);
                setPoints(previous => mode === "rectangle" && previous.length >= 2 ? [point] : [...previous, point]);
              }} style={styles.drawingSurface} /> : null}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      <View style={styles.legend}>
        {(["AVAILABLE", "ADVANCE", "SOLD"] as const).map(status => <View key={status} style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: statusColors[status] }]} /><Text style={styles.legendText}>{status[0] + status.slice(1).toLowerCase()}</Text></View>)}
      </View>
    </View>

    {drawing ? <InventoryPanel>
      <View style={styles.titleRow}><Text style={styles.panelTitle}>Drawing in progress</Text><Text style={styles.pointCount}>{points.length + (points.length === 1 ? " point" : " points")}</Text></View>
      <Button title="Apply drawing" busy={write.isPending || blocked} onPress={commit} />
      <Button title="Discard drawing" secondary onPress={() => setPoints([])} />
    </InventoryPanel> : null}
    {admin ? <Text style={styles.changeSummary}>{draft.changed.length + " plots changed" + (draft.regionsChanged ? "; regions changed" : "")}</Text> : null}
    {message ? <InlineNotice tone={message.includes("saved") ? "success" : "warning"}>{message}</InlineNotice> : null}
    {selected ? <Button title="Open selected plot" secondary onPress={() => router.push(("/inventory/plots/" + encoded(selected)) as Parameters<typeof router.push>[0])} /> : null}
  </View>;
}

function Viewless({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const styles = StyleSheet.create({
  screen: { gap: 14 },
  flex: { flex: 1 },
  toolbarPanel: { paddingVertical: 10 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  zoomGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  editActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.infoSurface },
  iconInactive: { opacity: 0.42 },
  zoomReadout: { minWidth: 52, alignItems: "center" },
  zoomValue: { color: theme.colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "800" },
  zoomLabel: { color: theme.colors.muted, fontSize: 9, lineHeight: 13, fontWeight: "800" },
  selection: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  selectionLabel: { color: theme.colors.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  selectionValue: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  selectionStatus: { color: theme.colors.muted, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  panelTitle: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  supporting: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  canvasFrame: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  canvasHeader: { minHeight: 64, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  canvasTitle: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  canvasHint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  plotCount: { color: theme.colors.primaryDark, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  viewport: { width: "100%", minHeight: 260, maxHeight: 480, overflow: "hidden", backgroundColor: "#EEF2F5" },
  svgOverlay: { position: "absolute", top: 0, left: 0 },
  drawingSurface: { position: "absolute", inset: 0 },
  legend: { padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 9, height: 9, borderRadius: 3 },
  legendText: { color: theme.colors.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  pointCount: { color: theme.colors.primaryDark, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  changeSummary: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "700", textAlign: "center" }
});
