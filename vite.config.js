// vite.config.js
import { defineConfig } from "vite";
import { resolve, relative } from "path";
import { globSync } from "glob";

// Esto está perfecto para manejar tus múltiples HTML, no lo toques.
const htmlFiles = globSync("src/**/*.html", {
  ignore: "src/**/partials/**",
});

const rollupInputs = htmlFiles.reduce((acc, file) => {
  const name = relative("src", file).replace(".html", "");
  acc[name] = resolve(__dirname, file);
  return acc;
}, {});

// Tu plugin para rutas dinámicas, dejalo como está.
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
  // 1. Le decimos a Vite que la raíz de nuestro código fuente es 'src'.
  root: "src/",

  // 2. NO especificamos publicDir. Vite lo encontrará solo en 'src/public'.
  //    Esta es la corrección más importante.

  // 3. La configuración de 'build' está bien.
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: rollupInputs,
    },
  },

  // 4. Mantenemos tu plugin.
  plugins: [dynamicRoutesPlugin()],

  // 5. La base en '/' es perfecta para Netlify y rutas absolutas.
  base: "/",
});
