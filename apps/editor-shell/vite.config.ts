import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const stripMissingFlexLayoutSourceMap = () => ({
  name: "strip-missing-flexlayout-source-map",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!id.includes("flexlayout-react") || !id.endsWith("/style/dark.css")) {
      return null;
    }

    return code.replace(/\/\*# sourceMappingURL=dark\.css\.map \*\/\s*$/, "");
  },
});

export default defineConfig({
  plugins: [stripMissingFlexLayoutSourceMap(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
