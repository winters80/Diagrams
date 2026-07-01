/**
 * Canonical Azure service catalog.
 *
 * Each key maps to a display name (the official service name, per the WAF
 * "use official icons and service names" rule), an icon file under
 * public/icons/azure/, and a category. The keys are the ONLY service values
 * Claude is allowed to use — the list is injected into the system prompt so the
 * model can't invent services or drift from official naming. Anything without a
 * fitting icon falls back to `generic.block`.
 *
 * The bundled SVGs are lightweight, Azure-styled stand-ins so the app runs with
 * no external download. To use Microsoft's official icon pack, drop the official
 * SVGs into public/icons/azure/ using these same filenames.
 */

export interface ServiceMeta {
  displayName: string;
  icon: string; // path under /public
  category: string;
}

export const SERVICES: Record<string, ServiceMeta> = {
  // Compute
  "azure.app_service": { displayName: "Azure App Service", icon: "/icons/azure/app_service.svg", category: "Compute" },
  "azure.functions": { displayName: "Azure Functions", icon: "/icons/azure/functions.svg", category: "Compute" },
  "azure.aks": { displayName: "Azure Kubernetes Service", icon: "/icons/azure/aks.svg", category: "Compute" },
  "azure.vm": { displayName: "Virtual Machine", icon: "/icons/azure/vm.svg", category: "Compute" },
  "azure.container_apps": { displayName: "Azure Container Apps", icon: "/icons/azure/container_apps.svg", category: "Compute" },

  // Data
  "azure.sql_database": { displayName: "Azure SQL Database", icon: "/icons/azure/sql_database.svg", category: "Data" },
  "azure.cosmos_db": { displayName: "Azure Cosmos DB", icon: "/icons/azure/cosmos_db.svg", category: "Data" },
  "azure.blob_storage": { displayName: "Azure Blob Storage", icon: "/icons/azure/blob_storage.svg", category: "Storage" },
  "azure.redis": { displayName: "Azure Cache for Redis", icon: "/icons/azure/redis.svg", category: "Data" },
  "azure.postgres": { displayName: "Azure Database for PostgreSQL", icon: "/icons/azure/postgres.svg", category: "Data" },

  // Networking / edge
  "azure.front_door": { displayName: "Azure Front Door", icon: "/icons/azure/front_door.svg", category: "Networking" },
  "azure.app_gateway": { displayName: "Application Gateway", icon: "/icons/azure/app_gateway.svg", category: "Networking" },
  "azure.load_balancer": { displayName: "Load Balancer", icon: "/icons/azure/load_balancer.svg", category: "Networking" },
  "azure.api_management": { displayName: "API Management", icon: "/icons/azure/api_management.svg", category: "Integration" },
  "azure.cdn": { displayName: "Azure CDN", icon: "/icons/azure/cdn.svg", category: "Networking" },
  "azure.dns": { displayName: "Azure DNS", icon: "/icons/azure/dns.svg", category: "Networking" },

  // Messaging / integration
  "azure.service_bus": { displayName: "Azure Service Bus", icon: "/icons/azure/service_bus.svg", category: "Integration" },
  "azure.event_hub": { displayName: "Azure Event Hubs", icon: "/icons/azure/event_hub.svg", category: "Integration" },
  "azure.event_grid": { displayName: "Azure Event Grid", icon: "/icons/azure/event_grid.svg", category: "Integration" },

  // Security / identity
  "azure.entra_id": { displayName: "Microsoft Entra ID", icon: "/icons/azure/entra_id.svg", category: "Identity" },
  "azure.key_vault": { displayName: "Azure Key Vault", icon: "/icons/azure/key_vault.svg", category: "Security" },
  "azure.firewall": { displayName: "Azure Firewall", icon: "/icons/azure/firewall.svg", category: "Security" },

  // Observability / AI
  "azure.monitor": { displayName: "Azure Monitor", icon: "/icons/azure/monitor.svg", category: "Management" },
  "azure.app_insights": { displayName: "Application Insights", icon: "/icons/azure/app_insights.svg", category: "Management" },
  "azure.openai": { displayName: "Azure OpenAI Service", icon: "/icons/azure/openai.svg", category: "AI" },

  // Power Platform
  "powerplatform.power_apps": { displayName: "Power Apps", icon: "/icons/powerplatform/power_apps.svg", category: "Power Platform" },
  "powerplatform.power_automate": { displayName: "Power Automate", icon: "/icons/powerplatform/power_automate.svg", category: "Power Platform" },
  "powerplatform.power_bi": { displayName: "Power BI", icon: "/icons/powerplatform/power_bi.svg", category: "Power Platform" },
  "powerplatform.power_pages": { displayName: "Power Pages", icon: "/icons/powerplatform/power_pages.svg", category: "Power Platform" },
  "powerplatform.copilot_studio": { displayName: "Copilot Studio", icon: "/icons/powerplatform/copilot_studio.svg", category: "Power Platform" },
  "powerplatform.dataverse": { displayName: "Dataverse", icon: "/icons/powerplatform/dataverse.svg", category: "Power Platform" },
  "powerplatform.ai_builder": { displayName: "AI Builder", icon: "/icons/powerplatform/ai_builder.svg", category: "Power Platform" },
  "powerplatform.connectors": { displayName: "Connectors", icon: "/icons/powerplatform/connectors.svg", category: "Power Platform" },

  // Generic actors / external systems (no vendor logo, per WAF guidance)
  "generic.user": { displayName: "User", icon: "/icons/azure/generic_user.svg", category: "Generic" },
  "generic.external": { displayName: "External System", icon: "/icons/azure/generic_external.svg", category: "Generic" },
  "generic.block": { displayName: "Component", icon: "/icons/azure/generic_block.svg", category: "Generic" },
};

export const GENERIC_FALLBACK = "generic.block";

export function getService(key: string): ServiceMeta {
  return SERVICES[key] ?? SERVICES[GENERIC_FALLBACK];
}

/** The list of valid service keys, injected into the system prompt. */
export function serviceCatalogForPrompt(): string {
  return Object.entries(SERVICES)
    .map(([key, meta]) => `- ${key} — ${meta.displayName} (${meta.category})`)
    .join("\n");
}
