import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        "GM_addStyle": "readonly",
        "GM_getValue": "readonly",
        "GM_setValue": "readonly",
        ...globals.browser
      }
    }
  }
];
