export default {
  "*.{js,mjs,cjs,ts,tsx,json,jsonc,css,md}": [
    "biome check --write --no-errors-on-unmatched",
  ],
  ".github/workflows/*.{yml,yaml}": ["actionlint"],
};
