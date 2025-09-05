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

// Plugin para copiar imágenes estáticas
const copyImagesPlugin = () => ({
  name: "copy-images",
  closeBundle() {
    const fs = require("fs");
    const path = require("path");
    
    const srcDir = path.resolve(__dirname, "src/assets/images");
    const destDir = path.resolve(__dirname, "dist/assets/images");
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
      console.log("Imágenes copiadas correctamente");
    }
  },
});

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
  root: "src/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: rollupInputs,
    },
    assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.webp", "**/*.gif"],
  },
  plugins: [copyImagesPlugin(), dynamicRoutesPlugin()],
  // Configuración importante para Netlify
  base: process.env.NODE_ENV === 'production' ? './' : '/',
});