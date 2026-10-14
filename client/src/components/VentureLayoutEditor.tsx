import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { plotApi, ventureApi, type Plot, type Venture } from "@/services/api";
import { useElementSize } from "@/hooks/useElementSize";
import { useSearchParams } from "react-router-dom";
import {
  boxToPercentStyle,
  getObjectContainBox,
  normalizedRectFromClientDrag,
  normalizedRectToPercentStyle,
  type NormalizedRect,
  type Size
} from "@/lib/objectContain";
import { detectPlotRectanglesFromLayoutImage } from "@/utils/rectangleAutoDetect";

type Rect = { x: number; y: number; width: number; height: number };
type LayoutView = "original" | "enhanced" | "blueprint";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const toNumberFromPlotLabel = (value?: string | null) => {
  if (!value) return null;
  const matches = value.match(/\d+/g);
  if (!matches?.length) return null;
  const last = matches[matches.length - 1];
  const parsed = Number(last);
  return Number.isFinite(parsed) ? parsed : null;
};

const sortPlotsForMapping = (plots: Plot[]) => {
  return [...plots].sort((a, b) => {
    const an = toNumberFromPlotLabel(a.plotNumber);
    const bn = toNumberFromPlotLabel(b.plotNumber);
    if (an != null && bn != null && an !== bn) return an - bn;
    if (a.plotNumber && b.plotNumber) return a.plotNumber.localeCompare(b.plotNumber);
    return (a.id || "").localeCompare(b.id || "");
  });
};

const getLayoutFilters = (view: LayoutView) => {
  if (view === "enhanced") {
    return "contrast(1.2) saturate(1.1) brightness(1.05)";
  }
  if (view === "blueprint") {
    // This doesn't "colorize" the layout for real; it just styles it like a blueprint for readability.
    return "grayscale(1) contrast(1.35) brightness(1.05) sepia(1) hue-rotate(175deg) saturate(5)";
  }
  return "none";
};

const isMapped = (plot: Plot) =>
  plot.x != null && plot.y != null && plot.width != null && plot.height != null;

const VentureLayoutEditor = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useElementSize(containerRef);
  const [selectedVentureId, setSelectedVentureId] = useState("");
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<Rect | null>(null);
  const [mappingPlotId, setMappingPlotId] = useState<string>("");
  const mappingPlotIdRef = useRef<string>("");
  const [saving, setSaving] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [editPlotNumber, setEditPlotNumber] = useState("");
  const [editArea, setEditArea] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<Plot["status"]>("AVAILABLE");
  const [savingDetails, setSavingDetails] = useState(false);
  const [layoutView, setLayoutView] = useState<LayoutView>("original");

  const [drawMode, setDrawMode] = useState<"rectangle" | "polygon" | "road" | "park">("polygon");
  const [draftPolygon, setDraftPolygon] = useState<Array<{x: number, y: number}>>([]);

  const [layoutMediaSize, setLayoutMediaSize] = useState<Size | null>(null);
  const [detectingRects, setDetectingRects] = useState(false);


  const { data: venturesResponse } = useQuery({
    queryKey: ["ventures"],
    queryFn: () => ventureApi.list()
  });

  const ventures = venturesResponse?.data ?? [];
  const requestedVentureId = searchParams.get("ventureId") ?? "";

  const { data: ventureResponse } = useQuery({
    queryKey: ["venture", selectedVentureId],
    queryFn: () => ventureApi.get(selectedVentureId),
    enabled: Boolean(selectedVentureId)
  });

  const venture = ventureResponse?.data as Venture | undefined;
  const layoutUrl = ventureApi.getLayoutUrl(venture?.layoutImage);
  const isPdfLayout = layoutUrl?.toLowerCase().endsWith(".pdf");
  const plots = venture?.plots ?? [];
  const orderedPlots = useMemo(() => sortPlotsForMapping(plots), [plots]);
  const unmappedPlots = useMemo(
    () => orderedPlots.filter((plot) => plot.x == null || plot.y == null || plot.width == null || plot.height == null),
    [orderedPlots]
  );

  const overlayPlots = useMemo(() => orderedPlots.filter((plot) => isMapped(plot)), [orderedPlots]);

  useEffect(() => {
    setLayoutMediaSize(null);
  }, [layoutUrl]);

  const layoutBox = useMemo(() => {
    return getObjectContainBox(containerSize, isPdfLayout ? null : layoutMediaSize);
  }, [containerSize, isPdfLayout, layoutMediaSize]);

  const layoutBoxStyle = useMemo(() => boxToPercentStyle(layoutBox, containerSize), [layoutBox, containerSize]);

  const getPointerLayoutBox = (containerRect: DOMRect) => {
    return getObjectContainBox({ width: containerRect.width, height: containerRect.height }, isPdfLayout ? null : layoutMediaSize);
  };

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const clampRect = (rect: NormalizedRect, minSize = 0.01): NormalizedRect => {
    const width = Math.max(minSize, clamp01(rect.width));
    const height = Math.max(minSize, clamp01(rect.height));
    const x = clamp01(Math.min(rect.x, 1 - width));
    const y = clamp01(Math.min(rect.y, 1 - height));
    return { x, y, width, height };
  };

  const getNormalizedPointFromClient = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const el = containerRef.current;
    const borderRect = el.getBoundingClientRect();
    const containerRect = new DOMRect(
      borderRect.left + el.clientLeft,
      borderRect.top + el.clientTop,
      el.clientWidth,
      el.clientHeight
    );
    const box = getPointerLayoutBox(containerRect);

    const localX = clientX - containerRect.left;
    const localY = clientY - containerRect.top;

    const xInBox = Math.min(box.x + box.width, Math.max(box.x, localX));
    const yInBox = Math.min(box.y + box.height, Math.max(box.y, localY));

    const x = box.width > 0 ? (xInBox - box.x) / box.width : 0;
    const y = box.height > 0 ? (yInBox - box.y) / box.height : 0;
    return { x: clamp01(x), y: clamp01(y) };
  };

  useEffect(() => {
    mappingPlotIdRef.current = mappingPlotId;
  }, [mappingPlotId]);

  useEffect(() => {
    if (!requestedVentureId || !ventures.length) return;
    const matchedVenture = ventures.find((item) => item.id === requestedVentureId);
    if (!matchedVenture) return;
    setSelectedVentureId((current) => (current === matchedVenture.id ? current : matchedVenture.id));
  }, [requestedVentureId, ventures]);

  useEffect(() => {
    if (!selectedVentureId) return;
    if (mappingPlotIdRef.current) return;
    const firstUnmapped = unmappedPlots[0]?.id ?? "";
    if (firstUnmapped) setMappingPlotId(firstUnmapped);
  }, [selectedVentureId, unmappedPlots]);

  useEffect(() => {
    setLayoutFile(null);
    setDraftRect(null);
    setDraftPolygon([]);
    setMappingPlotId("");
  }, [selectedVentureId]);

  useEffect(() => {
    if (!selectedVentureId) return;
    if (requestedVentureId === selectedVentureId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("ventureId", selectedVentureId);
    setSearchParams(nextParams, { replace: true });
  }, [requestedVentureId, searchParams, selectedVentureId, setSearchParams]);

  const handleUpload = async () => {
    if (!selectedVentureId || !layoutFile) {
      toast.error("Select a venture and layout file first.");
      return;
    }
    try {
      const response = await ventureApi.uploadLayout(selectedVentureId, layoutFile);
      toast.success(response.message || "Layout uploaded");
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
      setLayoutFile(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload layout");
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const requiresPlotSelection = drawMode === "rectangle" || drawMode === "polygon";
    if (requiresPlotSelection && !mappingPlotIdRef.current) {
      const firstUnmapped = unmappedPlots[0]?.id ?? "";
      if (!firstUnmapped) {
        toast.error("No unmapped plots found. Create plots first.");
        return;
      }
      setMappingPlotId(firstUnmapped);
      mappingPlotIdRef.current = firstUnmapped;
      toast.message("Selected the next unmapped plot. Now draw on the layout.");
    }
    if (!containerRef.current) return;
    event.preventDefault();

    if (drawMode === "polygon" || drawMode === "road" || drawMode === "park") {
      const pt = getNormalizedPointFromClient(event.clientX, event.clientY);
      setDraftPolygon(prev => [...prev, pt]);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setDraftRect(null);
  };


  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drawMode !== "rectangle") return;
    if (!isDrawing || !dragStart || !containerRef.current) return;
    const el = containerRef.current;
    const borderRect = el.getBoundingClientRect();
    const containerRect = new DOMRect(
      borderRect.left + el.clientLeft,
      borderRect.top + el.clientTop,
      el.clientWidth,
      el.clientHeight
    );
    const box = getPointerLayoutBox(containerRect);
    const next = normalizedRectFromClientDrag(containerRect, box, dragStart, { x: event.clientX, y: event.clientY });
    setDraftRect(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drawMode !== "rectangle") return;
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
    setDragStart(null);
  };

  const openEditPlot = (plot: Plot) => {
    setEditingPlot(plot);
    setEditPlotNumber(plot.plotNumber ?? "");
    setEditArea(Number(plot.area ?? 0));
    setEditPrice(Number(plot.pricePerSqYard ?? 0));
    setEditStatus(plot.status ?? "AVAILABLE");
  };

  const savePlotDetails = async () => {
    if (!editingPlot) return;
    if (!editPlotNumber.trim() || !editArea || !editPrice) {
      toast.error("Enter plot number, area, and price.");
      return;
    }
    setSavingDetails(true);
    try {
      await plotApi.update(editingPlot.id, {
        plotNumber: editPlotNumber.trim(),
        area: Number(editArea),
        pricePerSqYard: Number(editPrice),
        status: editStatus
      });
      toast.success("Plot updated");
      setEditingPlot(null);
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
    } catch (error: any) {
      toast.error(error?.message || "Failed to update plot");
    } finally {
      setSavingDetails(false);
    }
  };

  const applyDetectedRectangles = async () => {
    if (!selectedVentureId) {
      toast.error("Select a venture first.");
      return;
    }
    if (!layoutUrl || isPdfLayout) {
      toast.error("Upload an image layout (PNG/JPG) to auto-detect rectangles.");
      return;
    }

    const targets = sortPlotsForMapping(unmappedPlots);
    if (!targets.length) {
      toast.message("No unmapped plots left to auto-detect.");
      return;
    }

    setDetectingRects(true);
    try {
      const detected = await detectPlotRectanglesFromLayoutImage(layoutUrl);
      if (!detected.length) {
        toast.error("No plot-like rectangles were detected.");
        return;
      }

      const limit = Math.min(detected.length, targets.length);
      const updates = targets.slice(0, limit).map((plot, index) => ({
        id: plot.id,
        ...clampRect(detected[index])
      }));

      await plotApi.updateCoordsBatch(updates);
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
      setMappingPlotId(targets[limit]?.id ?? "");
      toast.success(`Auto-mapped ${limit} plots from detected rectangles.`);
      if (detected.length > targets.length) {
        toast.message(`Detected ${detected.length - targets.length} extra regions that were ignored.`);
      }
    } catch (error: any) {
      toast.error(String(error?.message || "Failed to auto-detect plot rectangles"));
    } finally {
      setDetectingRects(false);
    }
  };


  const saveDraft = async () => {
    const plotId = mappingPlotIdRef.current || mappingPlotId;
    if (!draftRect || !plotId) {
      toast.error("Select a plot and draw a rectangle.");
      return;
    }

    const nextPlotId = unmappedPlots.find((p) => p.id !== plotId)?.id ?? "";
    setSaving(true);
    try {
      await plotApi.updateCoords(plotId, draftRect);
      toast.success("Plot coordinates saved");
      setDraftRect(null);
      setMappingPlotId(nextPlotId);
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
    } catch (error: any) {
      const message = String(error?.message || "Failed to save plot coordinates");
      toast.error(message);
      if (message.toLowerCase().includes("record not found") || message.toLowerCase().includes("no longer exists")) {
        await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
        setMappingPlotId("");
      }
    } finally {
      setSaving(false);
    }
  };

  const savePolygonDraft = async () => {
    const plotId = mappingPlotIdRef.current || mappingPlotId;
    if (draftPolygon.length < 3 || !plotId) {
      toast.error("Finish drawing at least 3 points for the polygon.");
      return;
    }

    // Calculate bounding box for the polygon
    const minX = Math.min(...draftPolygon.map((p) => p.x));
    const maxX = Math.max(...draftPolygon.map((p) => p.x));
    const minY = Math.min(...draftPolygon.map((p) => p.y));
    const maxY = Math.max(...draftPolygon.map((p) => p.y));
    const width = maxX - minX;
    const height = maxY - minY;

    const payload = {
      x: minX,
      y: minY,
      width,
      height,
      shapeData: { type: "polygon", points: draftPolygon }
    };

    const nextPlotId = unmappedPlots.find((p) => p.id !== plotId)?.id ?? "";
    setSaving(true);
    try {
      await plotApi.updateCoords(plotId, payload);
      toast.success("Polygon coordinates saved");
      setDraftPolygon([]);
      setMappingPlotId(nextPlotId);
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
    } catch (error: any) {
      toast.error(String(error?.message || "Failed to save polygon"));
    } finally {
      setSaving(false);
    }
  };

  const saveRegionsDraft = async (type: "road" | "park") => {
    if (draftPolygon.length < 3) {
      toast.error("Finish drawing at least 3 points.");
      return;
    }

    const currentRegions = venture?.layoutRegions || { roads: [], parks: [] };
    const newRegion = { points: draftPolygon };
    
    const updatedRegions = {
      ...currentRegions,
      [type === "road" ? "roads" : "parks"]: [...(currentRegions[type === "road" ? "roads" : "parks"] || []), newRegion]
    };

    setSaving(true);
    try {
      await ventureApi.updateRegions(selectedVentureId, updatedRegions);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved`);
      setDraftPolygon([]);
      await queryClient.invalidateQueries({ queryKey: ["venture", selectedVentureId] });
    } catch (error: any) {
      toast.error(String(error?.message || "Failed to save region"));
    } finally {
      setSaving(false);
    }
  };

  const clearPolygonDraft = () => setDraftPolygon([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Layout Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Layout view</Label>
            <Select value={layoutView} onValueChange={(v) => setLayoutView(v as LayoutView)}>
              <SelectTrigger>
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="enhanced">Enhanced</SelectItem>
                <SelectItem value="blueprint">Black/Blue (Blueprint)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Venture</Label>
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger>
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Layout file (PDF/PNG/JPG)</Label>
            <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setLayoutFile(e.target.files?.[0] ?? null)} />
            <Button onClick={handleUpload} disabled={!selectedVentureId || !layoutFile}>
              Upload Layout
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label>Map a Plot</Label>
            <p className="text-xs text-muted-foreground">
              Select a plot (or just start drawing) {"->"} click + drag on the layout {"->"} save coordinates. Then click the green box to edit plot details.
            </p>
            <Select value={mappingPlotId} onValueChange={setMappingPlotId}>
              <SelectTrigger>
                <SelectValue placeholder="Select plot to map" />
              </SelectTrigger>
              <SelectContent>
                {unmappedPlots.map((plot: Plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    Plot {plot.plotNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-4 items-center">
              <div className="flex flex-wrap bg-muted rounded-md p-1 gap-1">
                <Button variant={drawMode === "rectangle" ? "secondary" : "ghost"} onClick={() => { setDrawMode("rectangle"); setDraftPolygon([]); }} size="sm">Rectangle</Button>
                <Button variant={drawMode === "polygon" ? "secondary" : "ghost"} onClick={() => { setDrawMode("polygon"); setDraftPolygon([]); }} size="sm">Plot Polygon</Button>
                <Button variant={drawMode === "road" ? "secondary" : "ghost"} onClick={() => { setDrawMode("road"); setDraftPolygon([]); }} size="sm">Road</Button>
                <Button variant={drawMode === "park" ? "secondary" : "ghost"} onClick={() => { setDrawMode("park"); setDraftPolygon([]); }} size="sm">Park</Button>
              </div>
            </div>
            
            {(drawMode === "road" || drawMode === "park") && (
              <div className="flex gap-2">
                <Button onClick={() => saveRegionsDraft(drawMode as "road" | "park")} disabled={draftPolygon.length < 3 || saving}>
                  Save {drawMode.charAt(0).toUpperCase() + drawMode.slice(1)} ({draftPolygon.length} pts)
                </Button>
                <Button variant="outline" onClick={clearPolygonDraft} disabled={draftPolygon.length === 0}>
                  Clear
                </Button>
              </div>
            )}
            
            {drawMode === "rectangle" && (
              <Button onClick={saveDraft} disabled={!draftRect || !mappingPlotId || saving}>
                Save Rectangle
              </Button>
            )}

            {drawMode === "polygon" && (
              <div className="flex gap-2">
                <Button onClick={savePolygonDraft} disabled={draftPolygon.length < 3 || !mappingPlotId || saving}>
                  Save Polygon ({draftPolygon.length} pts)
                </Button>
                <Button variant="outline" onClick={clearPolygonDraft} disabled={draftPolygon.length === 0}>
                  Clear
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={applyDetectedRectangles} disabled={!layoutUrl || isPdfLayout || detectingRects || saving}>
              {detectingRects ? "Detecting..." : "Auto-detect Rectangles"}
            </Button>
            {draftRect && drawMode === "rectangle" && (
              <p className="text-xs text-muted-foreground">
                Draft: x {draftRect.x.toFixed(3)}, y {draftRect.y.toFixed(3)}, w {draftRect.width.toFixed(3)}, h{" "}
                {draftRect.height.toFixed(3)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="relative w-full rounded-lg border border-border bg-white overflow-hidden"
            style={{ minHeight: 600 }}
          >
            {layoutUrl ? (
              isPdfLayout ? (
                <object
                  data={layoutUrl}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <div className="absolute inset-0" style={{ background: layoutView === "blueprint" ? "#0b1a2a" : "transparent" }}>
                  <img
                    src={layoutUrl}
                    alt="Venture layout"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ pointerEvents: "none", filter: getLayoutFilters(layoutView) }}
                    onLoad={(e) => setLayoutMediaSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                  />
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Upload a layout to start mapping plots.
              </div>
            )}

            {layoutUrl && (
            <div
              className="absolute inset-0 z-10"
              style={{
                touchAction: "none",
                cursor: drawMode === "road" || drawMode === "park" || mappingPlotId ? "crosshair" : "not-allowed"
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            )}

            <div className="absolute inset-0 z-20 pointer-events-none" style={layoutBoxStyle}>
              {/* Separate rendering for standard rectangles vs freeform polygons */}
              {overlayPlots.filter(p => !p.shapeData || p.shapeData.type !== "polygon").map((plot) => (
                <div
                  key={plot.id}
                  className="absolute border-2 border-emerald-500/80 bg-emerald-500/20 text-emerald-900 text-[10px] font-semibold flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-emerald-400/40"
                  style={{
                    left: `${(plot.x as number) * 100}%`,
                    top: `${(plot.y as number) * 100}%`,
                    width: `${(plot.width as number) * 100}%`,
                    height: `${(plot.height as number) * 100}%`
                  }}
                  onClick={() => openEditPlot(plot)}
                  title="Click to edit plot details"
                >
                  {plot.plotNumber}
                </div>
              ))}

              {/* Fullscreen SVG for exact Polygon hitboxes (avoids overlapping rectangular DIVs) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Render Venture Layout Regions (Roads and Parks) */}
                {venture?.layoutRegions?.roads?.map((road: any, idx: number) => (
                  <polygon
                    key={`road-${idx}`}
                    points={road.points.map((p: any) => `${p.x * 100},${p.y * 100}`).join(' ')}
                    fill="rgba(75, 85, 99, 0.5)"
                    stroke="rgba(31, 41, 55, 0.4)"
                    strokeWidth="0.2"
                  />
                ))}
                {venture?.layoutRegions?.parks?.map((park: any, idx: number) => (
                  <polygon
                    key={`park-${idx}`}
                    points={park.points.map((p: any) => `${p.x * 100},${p.y * 100}`).join(' ')}
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="rgba(21, 128, 61, 0.4)"
                    strokeWidth="0.2"
                  />
                ))}

                {overlayPlots.filter(p => p.shapeData && p.shapeData.type === "polygon").map((plot) => (
                  <g key={plot.id} className="pointer-events-auto cursor-pointer" onClick={() => openEditPlot(plot)}>
                    <polygon
                      points={plot.shapeData.points.map((p: any) => `${p.x * 100},${p.y * 100}`).join(' ')}
                      fill="rgba(16,185,129,0.3)"
                      stroke="rgba(16,185,129,0.8)"
                      strokeWidth="0.3"
                      className="hover:fill-emerald-400/50 transition-colors"
                    />
                    <text 
                      x={(plot.x as number + (plot.width as number)/2) * 100} 
                      y={(plot.y as number + (plot.height as number)/2) * 100} 
                      fontSize="1.5" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill="#064e3b" 
                      fontWeight="bold" 
                      className="pointer-events-none drop-shadow-md"
                    >
                      {plot.plotNumber}
                    </text>
                  </g>
                ))}
              </svg>

              {draftRect && drawMode === "rectangle" && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/20"
                  style={{
                    left: `${draftRect.x * 100}%`,
                    top: `${draftRect.y * 100}%`,
                    width: `${draftRect.width * 100}%`,
                    height: `${draftRect.height * 100}%`
                  }}
                />
              )}

              {draftPolygon.length > 0 && (drawMode === "polygon" || drawMode === "road" || drawMode === "park") && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon
                      points={draftPolygon.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                      fill={drawMode === "road" ? "rgba(75, 85, 99, 0.3)" : drawMode === "park" ? "rgba(34, 197, 94, 0.3)" : "rgba(59, 130, 246, 0.3)"}
                      stroke={drawMode === "road" ? "rgba(31, 41, 55, 0.8)" : drawMode === "park" ? "rgba(21, 128, 61, 0.8)" : "rgba(59, 130, 246, 0.8)"}
                      strokeWidth="0.5"
                    />
                    {draftPolygon.map((p, i) => (
                      <circle key={i} cx={p.x * 100} cy={p.y * 100} r="0.8" fill="white" stroke="blue" strokeWidth="0.2" />
                    ))}
                  </svg>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingPlot)} onOpenChange={(open) => !open && setEditingPlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plot number</Label>
              <Input value={editPlotNumber} onChange={(e) => setEditPlotNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area</Label>
                <Input type="number" min={1} value={editArea} onChange={(e) => setEditArea(Number(e.target.value || 0))} />
              </div>
              <div className="space-y-2">
                <Label>Price per sq yard</Label>
                <Input type="number" min={1} value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value || 0))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Plot["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                  <SelectItem value="ADVANCE">ADVANCE</SelectItem>
                  <SelectItem value="SOLD">SOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlot(null)} disabled={savingDetails}>
              Cancel
            </Button>
            <Button onClick={savePlotDetails} disabled={savingDetails}>
              {savingDetails ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VentureLayoutEditor;

