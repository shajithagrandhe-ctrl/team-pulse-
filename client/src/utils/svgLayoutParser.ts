export type SvgViewBox = { minX: number; minY: number; width: number; height: number };

export type SvgRectShape = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SvgPathShape = {
  id: string;
  d: string;
};

export type SvgPolygonShape = {
  id: string;
  points: Array<{ x: number; y: number }>;
};

export type SvgLayoutPlot = SvgRectShape & {
  plotNumber: string;
};

export type ParsedSvgLayout = {
  viewBox: SvgViewBox;
  plots: SvgLayoutPlot[];
  roads: Array<SvgRectShape | SvgPathShape | SvgPolygonShape>;
  parks: Array<SvgRectShape | SvgPathShape | SvgPolygonShape>;
};

const parseNumber = (value: string | null | undefined) => {
  if (!value) return 0;
  const cleaned = value.trim().replace(/px$/i, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseViewBox = (svg: SVGSVGElement): SvgViewBox => {
  const viewBoxAttr = svg.getAttribute("viewBox");
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[,\s]+/)
      .map((p) => Number.parseFloat(p))
      .filter((n) => Number.isFinite(n));
    if (parts.length >= 4) {
      return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const width = parseNumber(svg.getAttribute("width"));
  const height = parseNumber(svg.getAttribute("height"));
  return { minX: 0, minY: 0, width: width || 1000, height: height || 1000 };
};

const hasClass = (el: Element, className: string) => {
  const cls = el.getAttribute("class") || "";
  return cls.split(/\s+/).some((c) => c.toLowerCase() === className.toLowerCase());
};

const plotNumberFromId = (id: string) => {
  const match = id.match(/plot[-_\s]*(\d+)/i);
  if (match?.[1]) return match[1];
  return id.replace(/^plot[-_\s]*/i, "") || id;
};

const parseRect = (el: Element): SvgRectShape => {
  const id = el.getAttribute("id") || "";
  return {
    id,
    x: parseNumber(el.getAttribute("x")),
    y: parseNumber(el.getAttribute("y")),
    width: parseNumber(el.getAttribute("width")),
    height: parseNumber(el.getAttribute("height"))
  };
};

const parsePath = (el: Element): SvgPathShape => {
  const id = el.getAttribute("id") || "";
  return { id, d: el.getAttribute("d") || "" };
};

const parsePolygon = (el: Element): SvgPolygonShape => {
  const id = el.getAttribute("id") || "";
  const pointsAttr = el.getAttribute("points") || "";
  const points = pointsAttr
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(","))
    .map(([x, y]) => ({ x: Number.parseFloat(x), y: Number.parseFloat(y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  return { id, points };
};

export const parseSvgLayout = (svgText: string): ParsedSvgLayout => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg") as SVGSVGElement | null;

  const empty: ParsedSvgLayout = {
    viewBox: { minX: 0, minY: 0, width: 1000, height: 1000 },
    plots: [],
    roads: [],
    parks: []
  };

  if (!svg) return empty;

  const viewBox = parseViewBox(svg);

  const roads: ParsedSvgLayout["roads"] = [];
  const parks: ParsedSvgLayout["parks"] = [];

  doc.querySelectorAll(".road").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "rect") roads.push(parseRect(el));
    else if (tag === "path") roads.push(parsePath(el));
    else if (tag === "polygon" || tag === "polyline") roads.push(parsePolygon(el));
  });

  doc.querySelectorAll(".park").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "rect") parks.push(parseRect(el));
    else if (tag === "path") parks.push(parsePath(el));
    else if (tag === "polygon" || tag === "polyline") parks.push(parsePolygon(el));
  });

  const plots: SvgLayoutPlot[] = [];
  doc.querySelectorAll("rect").forEach((el) => {
    if (hasClass(el, "road") || hasClass(el, "park")) return;
    const id = el.getAttribute("id") || "";
    if (!id) return;
    const rect = parseRect(el);
    plots.push({ ...rect, plotNumber: plotNumberFromId(id) });
  });

  return {
    viewBox,
    plots,
    roads,
    parks
  };
};
