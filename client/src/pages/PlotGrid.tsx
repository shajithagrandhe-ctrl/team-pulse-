import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ExistingLeadsDialog from "@/components/ExistingLeadsDialog";
import PlotDetailDialog from "@/components/PlotDetailDialog";
import AddLeadModal from "@/components/AddLeadModal";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leadApi, ventureApi, type Plot } from "@/services/api";
import { useElementSize } from "@/hooks/useElementSize";
import { boxToPercentStyle, getObjectContainBox, normalizedRectToPercentStyle, type NormalizedRect, type Size } from "@/lib/objectContain";
import { useAuth } from "@/contexts/AuthContext";
import { parseSvgLayout, type SvgPathShape, type SvgPolygonShape, type SvgRectShape } from "@/utils/svgLayoutParser";

type RoadLane = {
  rect: NormalizedRect;
  axis: "x" | "y";
  direction: 1 | -1;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getBoundsFromPoints = (points: Array<{ x: number; y: number }>) => {
  if (!points.length) return null;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
};

const getBoundsFromPath = (d: string) => {
  const numbers = d.match(/-?\d*\.?\d+/g)?.map(Number.parseFloat).filter(Number.isFinite) ?? [];
  if (numbers.length < 4) return null;

  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < numbers.length - 1; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }

  return getBoundsFromPoints(points);
};

const boundsToNormalizedRect = (
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  viewBox: { minX: number; minY: number; width: number; height: number }
): NormalizedRect => ({
  x: clamp01((bounds.minX - viewBox.minX) / viewBox.width),
  y: clamp01((bounds.minY - viewBox.minY) / viewBox.height),
  width: clamp01((bounds.maxX - bounds.minX) / viewBox.width),
  height: clamp01((bounds.maxY - bounds.minY) / viewBox.height)
});

const normalizedPolygonToRect = (points: Array<{ x: number; y: number }>) => {
  const bounds = getBoundsFromPoints(points);
  if (!bounds) return null;

  return {
    x: clamp01(bounds.minX),
    y: clamp01(bounds.minY),
    width: clamp01(bounds.maxX - bounds.minX),
    height: clamp01(bounds.maxY - bounds.minY)
  };
};

const rectToRoadLane = (rect: NormalizedRect, index: number): RoadLane | null => {
  if (!(rect.width > 0.01 && rect.height > 0.01)) return null;

  const axis = rect.width >= rect.height ? "x" : "y";
  const thickness = axis === "x" ? rect.height : rect.width;
  const length = axis === "x" ? rect.width : rect.height;

  if (length < 0.08 || thickness < 0.012) return null;

  return {
    rect,
    axis,
    direction: index % 2 === 0 ? 1 : -1
  };
};

const vehicleAnimations = `
  @keyframes driveLaneXForward {
    0% { left: -28px; top: 50%; transform: translateY(-50%); opacity: 0; }
    10% { opacity: 0.95; }
    90% { opacity: 0.95; }
    100% { left: calc(100% + 8px); top: 50%; transform: translateY(-50%); opacity: 0; }
  }

  @keyframes driveLaneXReverse {
    0% { left: calc(100% + 8px); top: 50%; transform: translateY(-50%) scaleX(-1); opacity: 0; }
    10% { opacity: 0.95; }
    90% { opacity: 0.95; }
    100% { left: -28px; top: 50%; transform: translateY(-50%) scaleX(-1); opacity: 0; }
  }

  @keyframes driveLaneYForward {
    0% { top: -28px; left: 50%; transform: translateX(-50%) rotate(90deg); opacity: 0; }
    10% { opacity: 0.95; }
    90% { opacity: 0.95; }
    100% { top: calc(100% + 8px); left: 50%; transform: translateX(-50%) rotate(90deg); opacity: 0; }
  }

  @keyframes driveLaneYReverse {
    0% { top: calc(100% + 8px); left: 50%; transform: translateX(-50%) rotate(-90deg); opacity: 0; }
    10% { opacity: 0.95; }
    90% { opacity: 0.95; }
    100% { top: -28px; left: 50%; transform: translateX(-50%) rotate(-90deg); opacity: 0; }
  }

  .vehicle-lane {
    position: absolute;
    overflow: hidden;
    pointer-events: none;
    z-index: 2;
  }

  .vehicle {
    position: absolute;
    font-size: 1.05rem;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: none;
    filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.45));
    pointer-events: none;
    will-change: left, top, transform, opacity;
  }

  .vehicle[data-axis="x"][data-direction="1"] {
    animation: driveLaneXForward var(--vehicle-duration) linear infinite;
    animation-delay: var(--vehicle-delay);
  }

  .vehicle[data-axis="x"][data-direction="-1"] {
    animation: driveLaneXReverse var(--vehicle-duration) linear infinite;
    animation-delay: var(--vehicle-delay);
  }

  .vehicle[data-axis="y"][data-direction="1"] {
    animation: driveLaneYForward var(--vehicle-duration) linear infinite;
    animation-delay: var(--vehicle-delay);
  }

  .vehicle[data-axis="y"][data-direction="-1"] {
    animation: driveLaneYReverse var(--vehicle-duration) linear infinite;
    animation-delay: var(--vehicle-delay);
  }

  .vehicle::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: rgba(255,255,255,0.12);
    border-radius: 50%;
    z-index: -1;
  }
  .animate-plot-entrance {
    animation: fadeIn 0.4s ease-out backwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const PlotGrid = () => {
  const { locationId, ventureId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useElementSize(containerRef);
  const { user } = useAuth();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [showExistingLeads, setShowExistingLeads] = useState(false);
  const [showPlotDetail, setShowPlotDetail] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [layoutMediaSize, setLayoutMediaSize] = useState<Size | null>(null);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [showOriginalLayout, setShowOriginalLayout] = useState(true);

  const { data: ventureResponse, isLoading } = useQuery({
    queryKey: ["venture", ventureId],
    queryFn: () => ventureApi.get(ventureId || "")
  });

  const venture = ventureResponse?.data;
  const locationName = venture?.location?.name || "";
  const plots = venture?.plots || [];
  const renderPlots = useMemo(() => plots, [plots]);
  const layoutUrl = ventureApi.getLayoutUrl(venture?.layoutImage);
  const isPdfLayout = layoutUrl.toLowerCase().endsWith(".pdf");
  const isSvgLayout = layoutUrl.toLowerCase().endsWith(".svg");

  const parsedSvgLayout = useMemo(() => {
    if (!isSvgLayout || !svgText) return null;
    return parseSvgLayout(svgText);
  }, [isSvgLayout, svgText]);

  const hasSvgLayout = Boolean(layoutUrl) && isSvgLayout;
  const hasMappedPlotRects = useMemo(
    () => plots.some((p) => p.x != null && p.y != null && p.width != null && p.height != null),
    [plots]
  );
  const hasLayout = Boolean(layoutUrl) && (hasSvgLayout || hasMappedPlotRects);

  useEffect(() => {
    setLayoutMediaSize(null);
    setSvgText(null);
    setShowOriginalLayout(true);
  }, [layoutUrl]);

  useEffect(() => {
    if (!layoutUrl || !isSvgLayout) return;

    const controller = new AbortController();
    fetch(layoutUrl, { credentials: "include", signal: controller.signal })
      .then((response) => response.text())
      .then((text) => setSvgText(text))
      .catch(() => setSvgText(null));

    return () => controller.abort();
  }, [layoutUrl, isSvgLayout]);

  useEffect(() => {
    if (!layoutUrl || isPdfLayout || isSvgLayout) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setLayoutMediaSize({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    };
    img.onerror = () => {
      if (cancelled) return;
      setLayoutMediaSize(null);
    };
    img.src = layoutUrl;

    return () => {
      cancelled = true;
    };
  }, [layoutUrl, isPdfLayout, isSvgLayout]);

  useEffect(() => {
    if (!hasSvgLayout || !parsedSvgLayout) return;
    setLayoutMediaSize({ width: parsedSvgLayout.viewBox.width, height: parsedSvgLayout.viewBox.height });
  }, [hasSvgLayout, parsedSvgLayout]);

  const layoutBox = useMemo(() => {
    return getObjectContainBox(containerSize, isPdfLayout ? null : layoutMediaSize);
  }, [containerSize, isPdfLayout, layoutMediaSize]);
  const effectiveLayoutBox = useMemo(() => {
    if (layoutBox.width > 4 && layoutBox.height > 4) return layoutBox;
    return { x: 0, y: 0, width: containerSize.width, height: containerSize.height };
  }, [layoutBox, containerSize]);
  const layoutBoxStyle = useMemo(() => boxToPercentStyle(effectiveLayoutBox, containerSize), [effectiveLayoutBox, containerSize]);

  const svgOverlay = useMemo(() => {
    if (!hasSvgLayout || !parsedSvgLayout) return null;

    const viewBox = parsedSvgLayout.viewBox;
    const vbWidth = viewBox.width || 1;
    const vbHeight = viewBox.height || 1;

    const normalizePlotNumberKey = (value: string) => {
      const digits = value.match(/\d+/g);
      if (digits?.length) {
        const last = digits[digits.length - 1].replace(/^0+/, "");
        return last || "0";
      }
      return value.trim();
    };

    const plotsByExact = new Map<string, Plot[]>();
    const plotsByDigits = new Map<string, Plot[]>();

    const pushToMapQueue = (map: Map<string, Plot[]>, key: string, plot: Plot) => {
      const normalized = key.trim();
      if (!normalized) return;
      const existing = map.get(normalized);
      if (existing) {
        existing.push(plot);
        return;
      }
      map.set(normalized, [plot]);
    };

    // Keep matching deterministic so plots don't disappear when labels repeat (e.g. 101 in different blocks).
    const sortedPlots = [...renderPlots].sort((a, b) => {
      const aDigits = Number.parseInt(normalizePlotNumberKey(a.plotNumber), 10);
      const bDigits = Number.parseInt(normalizePlotNumberKey(b.plotNumber), 10);
      if (Number.isFinite(aDigits) && Number.isFinite(bDigits) && aDigits !== bDigits) return aDigits - bDigits;
      return a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true, sensitivity: "base" });
    });

    sortedPlots.forEach((plot) => {
      pushToMapQueue(plotsByExact, plot.plotNumber, plot);
      pushToMapQueue(plotsByDigits, normalizePlotNumberKey(plot.plotNumber), plot);
    });

    const rectToNormalized = (rect: SvgRectShape): NormalizedRect => ({
      x: (rect.x - viewBox.minX) / vbWidth,
      y: (rect.y - viewBox.minY) / vbHeight,
      width: rect.width / vbWidth,
      height: rect.height / vbHeight
    });

    const isRectShape = (shape: SvgRectShape | SvgPathShape | SvgPolygonShape): shape is SvgRectShape =>
      typeof (shape as SvgRectShape).x === "number" && typeof (shape as SvgRectShape).width === "number";

    const isPathShape = (shape: SvgRectShape | SvgPathShape | SvgPolygonShape): shape is SvgPathShape =>
      typeof (shape as SvgPathShape).d === "string";

    const isPolygonShape = (shape: SvgRectShape | SvgPathShape | SvgPolygonShape): shape is SvgPolygonShape =>
      Array.isArray((shape as SvgPolygonShape).points);

    const usedPlotIds = new Set<string>();
    const dequeueAvailable = (list?: Plot[]) => {
      if (!list?.length) return null;
      const nextIndex = list.findIndex((plot) => !usedPlotIds.has(plot.id));
      if (nextIndex === -1) return null;
      const selected = list[nextIndex];
      usedPlotIds.add(selected.id);
      return selected;
    };

    const plots = parsedSvgLayout.plots
      .map((svgPlot) => {
        const normalizedSvgKey = normalizePlotNumberKey(svgPlot.plotNumber);
        const plot =
          dequeueAvailable(plotsByExact.get(svgPlot.plotNumber)) ||
          dequeueAvailable(plotsByDigits.get(svgPlot.plotNumber)) ||
          dequeueAvailable(plotsByDigits.get(normalizedSvgKey));
        if (!plot) return null;
        return { plot, rect: rectToNormalized(svgPlot) };
      })
      .filter(Boolean) as Array<{ plot: Plot; rect: NormalizedRect }>;

    const roadRects = parsedSvgLayout.roads.filter(isRectShape).map(rectToNormalized);
    const parkRects = parsedSvgLayout.parks.filter(isRectShape).map(rectToNormalized);

    const roadVectors = parsedSvgLayout.roads.filter((shape) => isPathShape(shape) || isPolygonShape(shape));
    const parkVectors = parsedSvgLayout.parks.filter((shape) => isPathShape(shape) || isPolygonShape(shape));
    const roadLanes = [
      ...roadRects.map((rect, index) => rectToRoadLane(rect, index)),
      ...roadVectors.map((shape, index) => {
        if ("d" in shape) {
          const bounds = getBoundsFromPath(shape.d);
          if (!bounds) return null;
          return rectToRoadLane(boundsToNormalizedRect(bounds, viewBox), roadRects.length + index);
        }

        const bounds = getBoundsFromPoints(shape.points);
        if (!bounds) return null;
        return rectToRoadLane(boundsToNormalizedRect(bounds, viewBox), roadRects.length + index);
      })
    ].filter(Boolean) as RoadLane[];

    return {
      viewBox,
      plots,
      roadRects,
      parkRects,
      roadVectors,
      parkVectors,
      roadLanes
    };
  }, [hasSvgLayout, parsedSvgLayout, renderPlots]);

  const imageRoadLanes = useMemo(() => {
    const roads = venture?.layoutRegions?.roads;
    if (!Array.isArray(roads)) return [];

    return roads
      .map((road: { points?: Array<{ x: number; y: number }> }, index: number) => {
        if (!Array.isArray(road?.points)) return null;
        const rect = normalizedPolygonToRect(road.points);
        if (!rect) return null;
        return rectToRoadLane(rect, index);
      })
      .filter(Boolean) as RoadLane[];
  }, [venture?.layoutRegions]);

  const vehicleLanes = svgOverlay?.roadLanes?.length ? svgOverlay.roadLanes : imageRoadLanes;
  const shouldRenderSvgOverlay = Boolean(svgOverlay && svgOverlay.plots.length > 0);
  const shouldRenderImageCoords = !shouldRenderSvgOverlay && hasMappedPlotRects;
  const shouldRenderFallbackPlotList = plots.length > 0 && !shouldRenderSvgOverlay && !hasMappedPlotRects;
  const animatedVehicles = useMemo(() => {
    const icons = ["🚗", "🚙", "🚕", "🚐"];
    return vehicleLanes.slice(0, 10).map((lane, index) => ({
      lane,
      icon: icons[index % icons.length],
      duration: `${12 + (index % 4) * 2}s`,
      delay: `-${index * 1.9}s`
    }));
  }, [vehicleLanes]);

  if (isLoading) {
    return <div className="p-8 text-slate-300">Loading plots...</div>;
  }

  if (!venture) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-100">Venture not found</h1>
        <button
          onClick={() => navigate(`/ventures/${locationId}`)}
          className="text-blue-300 hover:text-blue-200"
        >
          Back to ventures
        </button>
      </div>
    );
  }

  const available = plots.filter((p) => p.status === "AVAILABLE").length;
  const advance = plots.filter((p) => p.status === "ADVANCE").length;
  const sold = plots.filter((p) => p.status === "SOLD").length;
  const isCustomer = user?.role === "CUSTOMER";

  const handleAddNewLead = () => {
    setShowExistingLeads(false);
    setShowAddLead(true);
  };

  const handleCreateLeadSubmit = async (leadData: any) => {
    if (!selectedPlot) return;

    try {
      await leadApi.create({
        plotId: selectedPlot.id,
        plotNumber: selectedPlot.plotNumber,
        customerName: leadData.customerName,
        email: leadData.email,
        contactNumber: leadData.contactNumber,
        location: leadData.location || locationName,
        uniqueId: leadData.uniqueId,
        pricePerSqYard: Number(leadData.pricePerSqYard) || 0,
        notes: leadData.notes,
        photoUrl: undefined
      });

      await queryClient.invalidateQueries({ queryKey: ["venture", ventureId] });
      await queryClient.invalidateQueries({ queryKey: ["customer-records"] });
      toast.success("Lead created successfully!");
      setShowAddLead(false);
      setSelectedPlot(null);
      navigate("/reports");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create lead");
    }
  };

  const handlePlotClick = (plot: Plot) => {
    const leadCount = getLeadCount(plot);

    if (plot.status === "SOLD") {
      navigate("/sold-out");
      return;
    }

    if (isCustomer) {
      if (leadCount > 0) {
        setSelectedPlot(plot);
        setShowExistingLeads(true);
      } else {
        setSelectedPlot(plot);
        setShowPlotDetail(true);
      }
      return;
    }

    if (plot.status === "AVAILABLE" && leadCount > 0) {
      setSelectedPlot(plot);
      setShowExistingLeads(true);
    } else {
      setSelectedPlot(plot);
      setShowPlotDetail(true);
    }
  };

  const getLeadCount = (plot: Plot) => {
    return plot.leads?.length || 0;
  };

  return (
    <div className="p-8">
      <style>{vehicleAnimations}</style>
      <button onClick={() => navigate(`/ventures/${locationId}`)} className="mb-6 flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-slate-100">
        <ArrowLeft className="w-4 h-4" /> Back to {locationName}
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{venture.name}</h1>
        <p className="mt-1 text-sm text-slate-300">{locationName} - {venture.plots?.length || 0} plots</p>
      </div>

      <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-plot-available" />
          <span className="font-medium text-slate-100">Available ({available})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-plot-advance" />
          <span className="font-medium text-slate-100">Advance ({advance})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-plot-demand" />
          <span className="font-medium text-slate-100">High Demand</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-plot-sold" />
          <span className="font-medium text-slate-100">Sold ({sold})</span>
        </div>
      </div>

      {(hasLayout || plots.length > 0) ? (
        <>
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => setShowOriginalLayout((v) => !v)}
              className="text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
            >
              {showOriginalLayout ? "Hide layout image" : "Show layout image"}
            </button>
          </div>

          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-xl border border-slate-300/80 bg-gradient-to-br from-slate-50 to-blue-100/80"
            style={{ minHeight: 520 }}
          >
            {showOriginalLayout && (
              <>
                {isPdfLayout ? (
                  <object
                    data={layoutUrl}
                    type="application/pdf"
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: "none", opacity: 0.95 }}
                  />
                ) : (
                  <img
                    src={layoutUrl}
                    alt="Venture layout"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ pointerEvents: "none", opacity: 0.95 }}
                  />
                )}
              </>
            )}

            {/* Scatter animated vehicles over layout for lively feel */}
            <div className="absolute inset-0 pointer-events-none hidden" style={{ zIndex: 1, ...layoutBoxStyle }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const vehicleTypes = ["🚗", "🚙", "🚕", "🚐"];
                const isHorizontal = i % 2 === 0;
                const v = vehicleTypes[i % vehicleTypes.length];
                const startPos = (i * 15) + 10;
                return (
                  <div
                    key={`v-${i}`}
                    className="absolute text-xl"
                    style={{
                      [isHorizontal ? "top" : "left"]: `${startPos}%`,
                      [isHorizontal ? "left" : "top"]: "-10%",
                      animation: `${isHorizontal ? "driveAcrossRight" : "driveAcrossDown"} ${20 + i*2}s linear infinite`,
                      animationDelay: `-${i * 3}s`,
                      transform: isHorizontal ? "none" : "rotate(90deg)",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                      opacity: 0.8
                    }}
                  >
                    {v}
                  </div>
                );
              })}
            </div>

            {shouldRenderSvgOverlay ? (
              <>
              {/* Roads + Parks (non-clickable) */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {svgOverlay.roadRects.map((rect, index) => (
                  <div
                    key={`road-rect-${index}`}
                    className="absolute bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-500/60 shadow-inner"
                    style={normalizedRectToPercentStyle(rect, effectiveLayoutBox, containerSize)}
                  />
                ))}
                {svgOverlay.parkRects.map((rect, index) => (
                  <div
                    key={`park-rect-${index}`}
                    className="absolute bg-green-100/70 border border-green-200"
                    style={normalizedRectToPercentStyle(rect, effectiveLayoutBox, containerSize)}
                  />
                ))}

                {(svgOverlay.roadVectors.length > 0 || svgOverlay.parkVectors.length > 0) && (
                  <div className="absolute" style={layoutBoxStyle}>
                    <svg
                      className="w-full h-full"
                      viewBox={`${svgOverlay.viewBox.minX} ${svgOverlay.viewBox.minY} ${svgOverlay.viewBox.width} ${svgOverlay.viewBox.height}`}
                      preserveAspectRatio="none"
                    >
                      {svgOverlay.roadVectors.map((shape, index) => {
                        if ("d" in shape) {
                          return (
                            <path
                              key={`road-path-${shape.id || index}`}
                              d={shape.d}
                              fill="rgba(30, 41, 59, 0.88)"
                              stroke="rgba(15, 23, 42, 0.95)"
                              strokeWidth={2}
                            />
                          );
                        }

                        const points = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
                        return (
                          <polygon
                            key={`road-poly-${shape.id || index}`}
                            points={points}
                            fill="rgba(30, 41, 59, 0.88)"
                            stroke="rgba(15, 23, 42, 0.95)"
                            strokeWidth={2}
                          />
                        );
                      })}

                      {svgOverlay.parkVectors.map((shape, index) => {
                        if ("d" in shape) {
                          return (
                            <path
                              key={`park-path-${shape.id || index}`}
                              d={shape.d}
                              fill="rgba(134, 239, 172, 0.5)"
                              stroke="rgba(34, 197, 94, 0.5)"
                              strokeWidth={2}
                            />
                          );
                        }

                        const points = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
                        return (
                          <polygon
                            key={`park-poly-${shape.id || index}`}
                            points={points}
                            fill="rgba(134, 239, 172, 0.5)"
                            stroke="rgba(34, 197, 94, 0.5)"
                            strokeWidth={2}
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                {animatedVehicles.map(({ lane, icon, duration, delay }, index) => (
                  <div
                    key={`svg-vehicle-${index}`}
                    className="vehicle-lane"
                    style={normalizedRectToPercentStyle(lane.rect, effectiveLayoutBox, containerSize)}
                  >
                    <div
                      className="vehicle"
                      data-axis={lane.axis}
                      data-direction={lane.direction}
                      style={{ ["--vehicle-duration" as string]: duration, ["--vehicle-delay" as string]: delay }}
                    >
                      {icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Plots (clickable) */}
              <div className="absolute inset-0" style={{ zIndex: 3 }}>
                {svgOverlay.plots.map(({ plot, rect }) => (
                  <div key={`svg-plot-${plot.id}`} className="absolute p-1 animate-plot-entrance" style={normalizedRectToPercentStyle(rect, effectiveLayoutBox, containerSize)}>
                    <button
                      onClick={() => handlePlotClick(plot)}
                      className={cn(
                        "w-full h-full rounded-md flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 relative border-2 transform hover:scale-105 hover:shadow-xl overflow-hidden",
                        plot.status === "AVAILABLE" &&
                          "bg-gradient-to-br from-green-200 via-emerald-300 to-emerald-400 border-emerald-500 text-emerald-900 hover:from-emerald-100 hover:via-green-200 hover:to-emerald-300",
                        plot.status === "ADVANCE" &&
                          "bg-gradient-to-br from-yellow-200 via-orange-300 to-amber-400 border-amber-500 text-amber-900 hover:from-amber-100 hover:via-orange-200 hover:to-amber-300",
                        plot.status === "SOLD" &&
                          "bg-gradient-to-br from-rose-200 via-red-300 to-rose-400 border-rose-500 text-rose-900 hover:from-rose-100 hover:via-red-200 hover:to-rose-300"
                      )}
                    >
                      <div className="absolute top-0.5 left-0.5 bg-white/90 backdrop-blur-sm rounded px-1 py-0.5 border border-gray-300 shadow-sm">
                        <span className="text-xs font-bold text-gray-800">{plot.plotNumber}</span>
                      </div>

                      <div className="text-xs opacity-80">
                        <span>{plot.area} sq.yd</span>
                      </div>

                      <div className="absolute top-0.5 right-0.5">
                        {plot.status === "AVAILABLE" && (
                          <div className="bg-emerald-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                            A
                          </div>
                        )}
                        {plot.status === "ADVANCE" && (
                          <div className="bg-amber-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                            P
                          </div>
                        )}
                        {plot.status === "SOLD" && (
                          <div className="bg-rose-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                            S
                          </div>
                        )}
                      </div>

                      {getLeadCount(plot) > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white shadow-lg">
                          {getLeadCount(plot)}
                        </div>
                      )}

                      <div className="absolute bottom-0.5 right-0.5">
                        {plot.status === "AVAILABLE" && (
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse shadow-md" />
                        )}
                        {plot.status === "ADVANCE" && (
                          <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse shadow-md" />
                        )}
                        {plot.status === "SOLD" && <div className="w-1.5 h-1.5 bg-rose-600 rounded-full shadow-md" />}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              </>
            ) : shouldRenderImageCoords ? (
              <div className="absolute inset-0" style={{ zIndex: 2 }}>
                {/* Custom layout regions (roads/parks) for image layouts */}
                {venture.layoutRegions && (
                  <div className="absolute inset-0 pointer-events-none" style={layoutBoxStyle}>
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {venture.layoutRegions.roads?.map((road: any, idx: number) => (
                        <polygon
                          key={`road-${idx}`}
                          points={road.points.map((p: any) => `${p.x * 100},${p.y * 100}`).join(' ')}
                          fill="rgba(30, 41, 59, 0.82)"
                          stroke="rgba(15, 23, 42, 0.92)"
                          strokeWidth="0.2"
                        />
                      ))}
                      {venture.layoutRegions.parks?.map((park: any, idx: number) => (
                        <polygon
                          key={`park-${idx}`}
                          points={park.points.map((p: any) => `${p.x * 100},${p.y * 100}`).join(' ')}
                          fill="rgba(34, 197, 94, 0.3)"
                          stroke="rgba(21, 128, 61, 0.4)"
                          strokeWidth="0.2"
                        />
                      ))}
                    </svg>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                  {animatedVehicles.map(({ lane, icon, duration, delay }, index) => (
                    <div
                      key={`image-vehicle-${index}`}
                      className="vehicle-lane"
                      style={normalizedRectToPercentStyle(lane.rect, effectiveLayoutBox, containerSize)}
                    >
                      <div
                        className="vehicle"
                        data-axis={lane.axis}
                        data-direction={lane.direction}
                        style={{ ["--vehicle-duration" as string]: duration, ["--vehicle-delay" as string]: delay }}
                      >
                        {icon}
                      </div>
                    </div>
                  ))}
                </div>

                {renderPlots.map((plot) => {
                  if (plot.x == null || plot.y == null || plot.width == null || plot.height == null) return null;
                  const leadCount = getLeadCount(plot);
                  const isHighDemand = leadCount >= 5 && plot.status === "AVAILABLE";

                  const hasPolygon =
                    plot.shapeData &&
                    plot.shapeData.type === "polygon" &&
                    Array.isArray(plot.shapeData.points) &&
                    typeof plot.width === "number" &&
                    typeof plot.height === "number" &&
                    plot.width > 0 &&
                    plot.height > 0;
                  const safeWidth = typeof plot.width === "number" && plot.width > 0 ? plot.width : 1;
                  const safeHeight = typeof plot.height === "number" && plot.height > 0 ? plot.height : 1;

                  return (
                    <div
                      key={plot.id}
                      className={cn(
                        "absolute p-1 animate-plot-entrance",
                        hasPolygon ? "pointer-events-none" : "pointer-events-auto"
                      )}
                      style={normalizedRectToPercentStyle(
                        { x: plot.x, y: plot.y, width: plot.width, height: plot.height },
                        effectiveLayoutBox,
                        containerSize
                      )}
                    >
                      <button
                        onClick={() => handlePlotClick(plot)}
                        className={cn(
                          "w-full h-full rounded-md flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 relative transform hover:scale-105 hover:shadow-xl hover:z-50 overflow-visible",
                          !hasPolygon && "border-2 overflow-hidden",
                          plot.status === "AVAILABLE" && (hasPolygon ? "text-emerald-900" : "bg-emerald-500/10 border-emerald-500 text-emerald-900 hover:bg-emerald-400/20"),
                          plot.status === "ADVANCE" && (hasPolygon ? "text-amber-900" : "bg-amber-500/10 border-amber-500 text-amber-900 hover:bg-amber-400/20"),
                          plot.status === "SOLD" && (hasPolygon ? "text-rose-900" : "bg-rose-500/10 border-rose-500 text-rose-900 hover:bg-rose-400/20"),
                          isHighDemand && !hasPolygon && "ring-2 ring-blue-500/60"
                        )}
                        style={{ pointerEvents: hasPolygon ? 'none' : 'auto' }}
                      >
                        {hasPolygon && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible', zIndex: -1 }}>
                            <polygon
                              points={plot.shapeData.points.map((p: any) => 
                                `${((p.x - (plot.x ?? 0)) / safeWidth) * 100},${((p.y - (plot.y ?? 0)) / safeHeight) * 100}`
                              ).join(' ')}
                              className={cn(
                                "transition-all duration-300 cursor-pointer pointer-events-auto",
                                plot.status === "AVAILABLE" && "fill-emerald-400/10 stroke-emerald-500 hover:fill-emerald-400/30",
                                plot.status === "ADVANCE" && "fill-amber-400/10 stroke-amber-500 hover:fill-amber-400/30",
                                plot.status === "SOLD" && "fill-rose-400/10 stroke-rose-500 hover:fill-rose-400/30",
                                isHighDemand && "stroke-blue-500"
                              )}
                              strokeWidth="3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlotClick(plot);
                              }}
                            />
                          </svg>
                        )}
                        <div className="absolute top-0.5 left-0.5 bg-white/90 backdrop-blur-sm rounded px-1 py-0.5 border border-gray-300 shadow-sm z-10 pointer-events-auto">
                          <span className="text-xs font-bold text-gray-800">{plot.plotNumber}</span>
                        </div>

                        <div className="text-xs opacity-80">
                          <span>{plot.area} sq.yd</span>
                        </div>

                        <div className="absolute top-0.5 right-0.5">
                          {plot.status === "AVAILABLE" && (
                            <div className="bg-emerald-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                              A
                            </div>
                          )}
                          {plot.status === "ADVANCE" && (
                            <div className="bg-amber-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                              P
                            </div>
                          )}
                          {plot.status === "SOLD" && (
                            <div className="bg-rose-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-xs">
                              S
                            </div>
                          )}
                        </div>

                        {leadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white shadow-lg">
                            {leadCount}
                          </div>
                        )}

                        <div className="absolute bottom-0.5 right-0.5">
                          {plot.status === "AVAILABLE" && (
                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse shadow-md" />
                          )}
                          {plot.status === "ADVANCE" && (
                            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse shadow-md" />
                          )}
                          {plot.status === "SOLD" && <div className="w-1.5 h-1.5 bg-rose-600 rounded-full shadow-md" />}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : shouldRenderFallbackPlotList ? (
              <div className="absolute inset-0 p-4 md:p-6 overflow-auto" style={{ zIndex: 4 }}>
                <div className="mb-3 text-sm font-medium text-slate-700">
                  Plot layout mapping is missing for this venture. Showing all plots in list view.
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {renderPlots.map((plot) => (
                    <button
                      key={`fallback-plot-${plot.id}`}
                      onClick={() => handlePlotClick(plot)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-left text-xs font-semibold transition hover:shadow-md",
                        plot.status === "AVAILABLE" && "bg-emerald-100 border-emerald-400 text-emerald-900",
                        plot.status === "ADVANCE" && "bg-amber-100 border-amber-400 text-amber-900",
                        plot.status === "SOLD" && "bg-rose-100 border-rose-400 text-rose-900"
                      )}
                    >
                      <div>{plot.plotNumber}</div>
                      <div className="opacity-80 font-normal">{plot.area} sq.yd</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
          <p className="text-slate-600">This venture does not have a layout mapped yet.</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Number of leads on plot</span>
          </div>
        </div>
      </div>

      {selectedPlot && (
        <PlotDetailDialog
          plot={selectedPlot}
          open={showPlotDetail}
          onClose={() => setShowPlotDetail(false)}
          onAddLead={() => {
            setShowPlotDetail(false);
            setShowAddLead(true);
          }}
        />
      )}

      {showExistingLeads && selectedPlot && (
        <ExistingLeadsDialog
          plot={selectedPlot}
          open={showExistingLeads}
          onClose={() => setShowExistingLeads(false)}
          onAddNewLead={handleAddNewLead}
        />
      )}

      {showAddLead && selectedPlot && (
        <AddLeadModal
          open={showAddLead}
          onClose={() => {
            setShowAddLead(false);
            setSelectedPlot(null);
          }}
          onSubmit={handleCreateLeadSubmit}
          locationName={locationName}
          customer={{
            plotNumber: selectedPlot.plotNumber,
            ventureName: venture?.name,
            location: locationName,
            uniqueId: `ID-${Date.now()}`
          }}
        />
      )}
    </div>
  );
};

export default PlotGrid;
