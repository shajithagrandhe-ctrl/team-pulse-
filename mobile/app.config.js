const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");
const base = require("./app.json").expo;

module.exports = ({ config } = {}) => {
  const app = config || base;
  const localPreview = process.env.EXPO_PUBLIC_BUILD_CHANNEL === "local-preview";
  const result = {
    ...app,
    plugins: [...(app.plugins || []), "expo-sharing"],
    name: localPreview ? "Venture Plus Test" : app.name,
    android: { ...app.android, package: localPreview ? "com.ventureplus.mobile.preview" : app.android.package }
  };
  const manifestConfig = withAndroidManifest(result, (mod) => {
    const application = mod.modResults.manifest.application[0];
    // Local-test APKs use a private LAN API; normal releases disallow cleartext.
    application.$["android:usesCleartextTraffic"] = "false";
    if (localPreview) application.$["android:networkSecurityConfig"] = "@xml/local_preview_network_security";
    else delete application.$["android:networkSecurityConfig"];
    return mod;
  });
  if (!localPreview) return manifestConfig;
  const hostname = new URL(process.env.EXPO_PUBLIC_API_URL).hostname;
  return withDangerousMod(manifestConfig, ["android", async (result) => {
    const directory = path.join(result.modRequest.platformProjectRoot, "app/src/main/res/xml");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "local_preview_network_security.xml"),
      `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <base-config cleartextTrafficPermitted="false" />\n  <domain-config cleartextTrafficPermitted="true">\n    <domain includeSubdomains="false">${hostname}</domain>\n  </domain-config>\n</network-security-config>\n`);
    return result;
  }]);
};
