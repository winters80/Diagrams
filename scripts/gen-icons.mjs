// Generates lightweight, Azure-styled SVG placeholder icons into
// public/icons/azure/. Each is a colored rounded tile with a monogram.
// Replace these files with Microsoft's official Azure architecture icons
// (same filenames) to get the real icon set.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons", "azure");
mkdirSync(outDir, { recursive: true });

const CATEGORY_COLOR = {
  Compute: "#0078D4",
  Data: "#773ADC",
  Storage: "#00A4EF",
  Networking: "#0B7FC9",
  Integration: "#B4009E",
  Identity: "#0B5394",
  Security: "#C1121F",
  Management: "#5C2D91",
  AI: "#008272",
  Generic: "#6B7280",
};

// file base name -> [monogram, category]
const ICONS = {
  app_service: ["AS", "Compute"],
  functions: ["Fx", "Compute"],
  aks: ["K8", "Compute"],
  vm: ["VM", "Compute"],
  container_apps: ["CA", "Compute"],
  sql_database: ["SQL", "Data"],
  cosmos_db: ["CD", "Data"],
  blob_storage: ["Blob", "Storage"],
  redis: ["RC", "Data"],
  postgres: ["PG", "Data"],
  front_door: ["FD", "Networking"],
  app_gateway: ["AG", "Networking"],
  load_balancer: ["LB", "Networking"],
  api_management: ["API", "Integration"],
  cdn: ["CDN", "Networking"],
  dns: ["DNS", "Networking"],
  service_bus: ["SB", "Integration"],
  event_hub: ["EH", "Integration"],
  event_grid: ["EG", "Integration"],
  entra_id: ["ID", "Identity"],
  key_vault: ["KV", "Security"],
  firewall: ["FW", "Security"],
  monitor: ["Mon", "Management"],
  app_insights: ["AI", "Management"],
  openai: ["AOAI", "AI"],
  generic_user: ["Usr", "Generic"],
  generic_external: ["Ext", "Generic"],
  generic_block: ["·", "Generic"],
};

function svg(monogram, color) {
  const fontSize = monogram.length >= 3 ? 12 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${shade(color, -20)}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="44" height="44" rx="8" fill="url(#g)"/>
  <text x="24" y="24" dy="0.35em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${escapeXml(
    monogram
  )}</text>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

function shade(hex, percent) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (v * percent) / 100)));
  r = f(r);
  g = f(g);
  b = f(b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let count = 0;
for (const [name, [monogram, category]] of Object.entries(ICONS)) {
  const color = CATEGORY_COLOR[category] || CATEGORY_COLOR.Generic;
  writeFileSync(join(outDir, `${name}.svg`), svg(monogram, color));
  count++;
}
console.log(`Wrote ${count} icons to ${outDir}`);
