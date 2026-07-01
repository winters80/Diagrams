// Downloads official Microsoft icon SVGs and stores them under public/icons/
// with the filenames the app expects.
//
//   Azure           → benc-uk/icon-collection (official Azure architecture icons)
//   Power Platform  → aidevme/microsoft-cloud-product-icons
//
// These are Microsoft's official product/architecture icons; per Microsoft's
// icon terms they may be used in architecture/solution diagrams. They are not
// Anthropic assets. Re-run this script any time to refresh the set.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const azureDir = join(here, "..", "public", "icons", "azure");
const ppDir = join(here, "..", "public", "icons", "powerplatform");
mkdirSync(azureDir, { recursive: true });
mkdirSync(ppDir, { recursive: true });

const AZ = "https://raw.githubusercontent.com/benc-uk/icon-collection/master/azure-icons";
const PP =
  "https://raw.githubusercontent.com/aidevme/microsoft-cloud-product-icons/main/assets/Power%20Platfom";

// target filename (in public/icons/azure) -> source filename in the repo
const AZURE = {
  "app_service.svg": "App-Services.svg",
  "functions.svg": "Function-Apps.svg",
  "aks.svg": "Kubernetes-Services.svg",
  "vm.svg": "Virtual-Machine.svg",
  "container_apps.svg": "Container-Instances.svg",
  "sql_database.svg": "SQL-Database.svg",
  "cosmos_db.svg": "Azure-Cosmos-DB.svg",
  "blob_storage.svg": "Storage-Accounts.svg",
  "redis.svg": "Cache-Redis.svg",
  "postgres.svg": "Azure-Database-PostgreSQL-Server.svg",
  "front_door.svg": "Front-Doors.svg",
  "app_gateway.svg": "Application-Gateways.svg",
  "load_balancer.svg": "Load-Balancers.svg",
  "api_management.svg": "API-Management-Services.svg",
  "cdn.svg": "CDN-Profiles.svg",
  "dns.svg": "DNS-Zones.svg",
  "service_bus.svg": "Service-Bus.svg",
  "event_hub.svg": "Event-Hubs.svg",
  "event_grid.svg": "Event-Grid-Topics.svg",
  "entra_id.svg": "Azure-Active-Directory.svg",
  "key_vault.svg": "Key-Vaults.svg",
  "firewall.svg": "Firewalls.svg",
  "monitor.svg": "Monitor.svg",
  "app_insights.svg": "Application-Insights.svg",
  "openai.svg": "Cognitive-Services.svg",
};

// target filename (in public/icons/powerplatform) -> source filename
const POWER = {
  "power_apps.svg": "power-apps.svg",
  "power_automate.svg": "power-automate.svg",
  "power_bi.svg": "power-bi.svg",
  "power_pages.svg": "power-pages.svg",
  "copilot_studio.svg": "copilot-studio.svg",
  "dataverse.svg": "dataverse.svg",
  "ai_builder.svg": "ai-builder.svg",
  "connectors.svg": "connectors.svg",
  "power_platform.svg": "power-platform.svg",
};

async function fetchOne(base, src, destDir, destName) {
  const url = `${base}/${encodeURIComponent(src)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  if (!text.includes("<svg")) throw new Error(`not an SVG: ${url}`);
  writeFileSync(join(destDir, destName), text);
}

let ok = 0;
const failures = [];
for (const [dest, src] of Object.entries(AZURE)) {
  try {
    await fetchOne(AZ, src, azureDir, dest);
    ok++;
  } catch (e) {
    failures.push(`azure/${dest}: ${e.message}`);
  }
}
for (const [dest, src] of Object.entries(POWER)) {
  try {
    await fetchOne(PP, src, ppDir, dest);
    ok++;
  } catch (e) {
    failures.push(`powerplatform/${dest}: ${e.message}`);
  }
}

console.log(`Downloaded ${ok} icons.`);
if (failures.length) {
  console.log("Failures:\n" + failures.join("\n"));
  process.exitCode = 1;
}
