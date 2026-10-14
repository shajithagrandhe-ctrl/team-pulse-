import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const buildConfig = require("../app.config.js");

test("local-test package is isolated and normal release removes the HTTP exception", async () => {
  const previousChannel = process.env.EXPO_PUBLIC_BUILD_CHANNEL;
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  try {
    process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:4000/api";
    for (const preview of [false, true]) {
      if (preview) process.env.EXPO_PUBLIC_BUILD_CHANNEL = "local-preview";
      else delete process.env.EXPO_PUBLIC_BUILD_CHANNEL;
      const config = buildConfig();
      assert.equal(config.android.package, preview ? "com.ventureplus.mobile.preview" : "com.ventureplus.mobile");
      const result = await config.mods.android.manifest({
        ...config,
        modResults: { manifest: { application: [{ $: { "android:networkSecurityConfig": "old" } }] } },
        modRequest: { platform: "android", modName: "manifest" }
      });
      const application = result.modResults.manifest.application[0].$;
      assert.equal(application["android:usesCleartextTraffic"], "false");
      assert.equal(application["android:networkSecurityConfig"], preview ? "@xml/local_preview_network_security" : undefined);
    }
  } finally {
    if (previousChannel === undefined) delete process.env.EXPO_PUBLIC_BUILD_CHANNEL;
    else process.env.EXPO_PUBLIC_BUILD_CHANNEL = previousChannel;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});
