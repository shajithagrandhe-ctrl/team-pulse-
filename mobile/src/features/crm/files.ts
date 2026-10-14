import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function shareExport(name: "leads" | "customers" | "follow-up", contents: string, extension: "csv" | "ics") {
  if (!await Sharing.isAvailableAsync()) throw new Error("File sharing is unavailable on this device.");
  const file = new File(Paths.cache, `${name}-${Date.now()}.${extension}`);
  try {
    file.create({ overwrite: true });
    file.write(contents);
    await Sharing.shareAsync(file.uri, { mimeType: extension === "csv" ? "text/csv" : "text/calendar",
      UTI: extension === "csv" ? "public.comma-separated-values-text" : "com.apple.ical.ics", dialogTitle: "Export" });
  } finally {
    if (file.exists) file.delete();
  }
}
