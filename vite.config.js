// vite.config.js
import { defineConfig } from "vite";
import { resolve, relative } from "path";
import { globSync } from "glob";

const htmlFiles = globSync("src/**/*.html", {
  ignore: "src/**/partials/**",
});

const rollupInputs = htmlFiles.reduce((acc, file) => {
  const name = relative("src", file).replace(".html", "");
  acc[name] = resolve(__dirname, file);
  return acc;
}, {});

// Plugin para manejar rutas dinámicas (ESTE LO DEJÁS COMO ESTÁ)
const dynamicRoutesPlugin = () => ({
  name: "dynamic-routes",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (/^\/(companies|puzzles)\/\d+(\/)?$/.test(req.url)) {
        const section = req.url.split("/")[1];
        const targetHtml = section === "puzzles" ? "play.html" : "index.html";
        req.url = `/${section}/${targetHtml}`;
      }
      next();
    });
  },
});

export default defineConfig({
  // Directorio público. Vite lo busca por defecto, pero es bueno ser explícito.
  publicDir: "../public",
  root: "src/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: rollupInputs,
    },
  },
  plugins: [dynamicRoutesPlugin()], // Sacamos el copyImagesPlugin
  
  // Es mejor usar la base por defecto ('/') si usás rutas absolutas.
  // Netlify funciona perfecto con esto.
  base: '/', 
});