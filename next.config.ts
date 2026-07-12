import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las rutas de PDF leen las plantillas oficiales desde ./templates con
  // fs.readFileSync(process.cwd() + ...). El file-tracing de Next no detecta
  // esas rutas dinámicas, así que las incluimos explícitamente para que viajen
  // en el bundle serverless de Vercel (si no, la descarga daría 500).
  outputFileTracingIncludes: {
    "/api/registro/pdf": ["./templates/**"],
    "/api/verificacion/pdf": ["./templates/**"],
  },
};

export default nextConfig;
