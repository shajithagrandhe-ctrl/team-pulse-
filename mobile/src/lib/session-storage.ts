import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const key = "venture-plus-access-token";
let previewToken: string | null = null;

// The Expo web target is a QA preview, not a replacement for the cookie-based Vite site.
export const sessionStorage = {
  async read() {
    return Platform.OS === "web" ? previewToken : SecureStore.getItemAsync(key);
  },
  async write(token: string) {
    if (Platform.OS === "web") { previewToken = token; return; }
    await SecureStore.setItemAsync(key, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },
  async clear() {
    previewToken = null;
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  }
};
