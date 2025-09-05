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

// Plugin para manejar rutas dinámicas como /companies/1 o /puzzles/1
const dynamicRoutesPlugin = () => ({
  name: "dynamic-routes",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // La regla que busca /companies/{id} O /puzzles/{id}
      if (/^\/(companies|puzzles)\/\d+(\/)?$/.test(req.url)) {
        const section = req.url.split("/")[1]; // 'companies' o 'puzzles'

        // Si es 'puzzles', el archivo es 'play.html'. Si es 'companies', es 'index.html'.
        const targetHtml = section === "puzzles" ? "play.html" : "index.html";

        // Re-escribimos la URL para que Vite sirva el archivo correcto.
        req.url = `/${section}/${targetHtml}`;
      }
      next(); // Importante: dejamos que la petición continúe.
    });
  },
});

export default defineConfig({
  root: "src/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: rollupInputs,
    },
  },
  plugins: [dynamicRoutesPlugin()], // Asegúrate de que el plugin esté aquí.
});
