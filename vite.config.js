import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        login: resolve(__dirname, "src/login/index.html"),
        puzzles: resolve(__dirname, "src/puzzles/index.html"),
        crossword: resolve(__dirname, "src/puzzles/crosswords.html"),
        schedule: resolve(__dirname, "src/schedule/index.html"),
      },
    },
  },
});
