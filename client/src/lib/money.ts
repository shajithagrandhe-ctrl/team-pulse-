type FormatOptions = {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  croreAsMillion?: boolean;
};

const defaultPrefix = "";
const defaultSuffix = " Units";

const trimTrailingZeros = (value: string) => value.replace(/\.0+$|(\.\d*[1-9])0+$/g, "$1");

export const formatINRUnits = (amount: number, options: FormatOptions = {}) => {
  const prefix = options.prefix ?? defaultPrefix;
  const suffix = options.suffix ?? defaultSuffix;
  const decimals = options.decimals ?? 1;
  const croreAsMillion = options.croreAsMillion ?? false;

  if (!Number.isFinite(amount)) return `${prefix}0${suffix}`;
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (croreAsMillion && abs >= 1e6) {
    const value = trimTrailingZeros((abs / 1e6).toFixed(decimals));
    return `${sign}${prefix}${value}M${suffix}`;
  }
  if (abs >= 1e7) {
    const value = trimTrailingZeros((abs / 1e7).toFixed(decimals));
    return `${sign}${prefix}${value}Cr${suffix}`;
  }
  if (abs >= 1e5) {
    const value = trimTrailingZeros((abs / 1e5).toFixed(decimals));
    return `${sign}${prefix}${value}L${suffix}`;
  }
  if (abs >= 1e3) {
    const value = trimTrailingZeros((abs / 1e3).toFixed(decimals));
    return `${sign}${prefix}${value}K${suffix}`;
  }

  return `${sign}${prefix}${Math.round(abs).toString()}${suffix}`;
};

const parseNumberToken = (token: string) => {
  const cleaned = token.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const multiplierForSuffix = (suffixRaw: string) => {
  const suffix = suffixRaw.trim().toLowerCase();
  if (!suffix) return 1;
  if (suffix === "k") return 1e3;
  if (suffix === "l") return 1e5;
  if (suffix === "cr") return 1e7;
  if (suffix === "m") return 1e6;
  if (suffix === "b") return 1e9;
  return 1;
};

export const parseINRText = (text: string): number | null => {
  if (!text) return null;
  const raw = text.trim();

  // Preserve explicit ranges/labels (these are already "units")
  if (/\b(lakh|lakhs|crore|crores)\b/i.test(raw)) return null;

  const match = raw.match(/([+-]?\d+(?:[.,]\d+)*)\s*(cr|l|k|m|b)?\b/i);
  if (!match?.[1]) return null;

  const numeric = parseNumberToken(match[1]);
  if (numeric == null) return null;

  return numeric * multiplierForSuffix(match[2] || "");
};

export const formatINRTextToUnits = (text: string, options: FormatOptions = {}) => {
  if (!text) return text;
  const raw = text.trim();

  if (/\b(lakh|lakhs|crore|crores)\b/i.test(raw)) return text;

  const sign = raw.startsWith("+") ? "+" : raw.startsWith("-") ? "-" : "";
  const withoutSign = sign ? raw.slice(1).trim() : raw;

  // Handle simple ranges like: "INR 10,00,000 - INR 15,00,000"
  const rangeParts = withoutSign.split(/\s*[-–]\s*/).map((p) => p.trim()).filter(Boolean);
  if (rangeParts.length === 2) {
    const a = parseINRText(rangeParts[0]);
    const b = parseINRText(rangeParts[1]);
    if (a != null && b != null) {
      return `${sign}${formatINRUnits(a, options)} - ${formatINRUnits(b, options)}`;
    }
  }

  // Single value: strip common currency words/symbols and parse.
  const numeric = parseINRText(
    withoutSign
      .replace(/\b(inr|rs)\b\.?/gi, "")
      .replace(/[₹]/g, "")
      .trim()
  );
  if (numeric == null) return text;

  return `${sign}${formatINRUnits(numeric, options)}`;
};
