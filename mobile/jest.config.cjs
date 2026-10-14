module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.tsx"],
  clearMocks: true,
  moduleNameMapper: { "^lucide-react-native$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js" },
  setupFilesAfterEnv: ["<rootDir>/tests/component-setup.cjs"],
  transformIgnorePatterns: ["node_modules/(?!((jest-)?react-native(?:-.*)?|@react-native(-community)?/.*|expo(?:-.*)?|@expo/.*|@react-navigation/.*|@tanstack/.*|lucide-react-native)/)"]
};
