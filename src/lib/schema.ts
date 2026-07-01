import { z } from "zod";

/**
 * The one diagram model that all node/edge (architecture) diagrams share.
 *
 * The design encodes the rules from the two reference articles:
 *  - Azure Well-Architected: standard notation, official service names, metadata
 *    (title/description/author/version/date), a legend, and single-direction arrows
 *    (bidirectional relationships are two edges, never a double-headed arrow).
 *  - Lucid: logical grouping into layers/containers, clear labels, dependency mapping.
 *
 * Behavioral diagrams (sequence / state / ERD / flowchart / journey) don't fit a
 * node/edge canvas, so they are emitted as Mermaid text instead. A single flat
 * schema (rather than a discriminated union) keeps us inside the subset of JSON
 * Schema that structured outputs supports.
 */

export const DIAGRAM_TYPES = [
  "context",
  "container",
  "component",
  "deployment",
  "network",
  "dataflow",
] as const;

export const MERMAID_TYPES = [
  "sequence",
  "state",
  "erd",
  "flowchart",
  "journey",
] as const;

export const GROUP_KINDS = [
  "resourceGroup",
  "subnet",
  "vnet",
  "trustBoundary",
  "layer",
] as const;

export const EDGE_STYLES = ["sync", "async"] as const;

const legendEntrySchema = z.object({
  label: z.string().describe("The visual convention, e.g. 'Dashed line'."),
  meaning: z.string().describe("What it represents, e.g. 'Asynchronous call'."),
});

const metadataSchema = z.object({
  title: z.string().describe("Short diagram title."),
  description: z.string().describe("One or two sentences on what the diagram shows."),
  author: z.string().describe("Author name; use 'Prompt-to-Diagram' if unknown."),
  version: z.string().describe("Semantic version, e.g. '1.0'."),
  lastUpdated: z.string().describe("ISO date, e.g. '2026-07-01'."),
  diagramType: z
    .enum(DIAGRAM_TYPES)
    .describe("The kind of architecture diagram (progressive disclosure)."),
  legend: z
    .array(legendEntrySchema)
    .describe("Legend entries explaining any color/line conventions used."),
});

const groupSchema = z.object({
  id: z.string().describe("Unique id for this container."),
  label: z.string().describe("Visible label, e.g. 'Production VNet'."),
  kind: z.enum(GROUP_KINDS).describe("The kind of grouping container."),
  parentId: z
    .string()
    .nullable()
    .describe("Id of the parent group for nesting, or null for a top-level group."),
});

const nodeSchema = z.object({
  id: z.string().describe("Unique node id, referenced by edges."),
  label: z.string().describe("Primary label, e.g. 'Orders API'."),
  service: z
    .string()
    .describe(
      "Canonical Azure service key from the provided catalog (e.g. 'azure.app_service'). Use 'generic.block' if no icon fits."
    ),
  sublabel: z
    .string()
    .nullable()
    .describe("Optional secondary label such as SKU or role; null if none."),
  groupId: z
    .string()
    .nullable()
    .describe("Id of the group this node belongs to, or null if ungrouped."),
});

const edgeSchema = z.object({
  source: z.string().describe("Source node id (the initiating/client component)."),
  target: z.string().describe("Target node id (the dependency/server component)."),
  label: z.string().describe("What flows across this edge, e.g. 'HTTPS'."),
  style: z
    .enum(EDGE_STYLES)
    .describe("'sync' renders solid; 'async' renders dashed."),
  protocol: z
    .string()
    .nullable()
    .describe("Optional protocol annotation, e.g. 'gRPC'; null if not relevant."),
});

export const diagramSchema = z.object({
  renderer: z
    .enum(["diagram", "mermaid"])
    .describe(
      "'diagram' for node/edge architecture diagrams; 'mermaid' for behavioral diagrams."
    ),
  metadata: metadataSchema,
  groups: z
    .array(groupSchema)
    .describe("Grouping containers. Empty array when renderer is 'mermaid'."),
  nodes: z
    .array(nodeSchema)
    .describe("Architecture nodes. Empty array when renderer is 'mermaid'."),
  edges: z
    .array(edgeSchema)
    .describe("Directional edges. Empty array when renderer is 'mermaid'."),
  mermaid: z
    .string()
    .nullable()
    .describe("Mermaid source when renderer is 'mermaid'; otherwise null."),
  mermaidType: z
    .enum(MERMAID_TYPES)
    .nullable()
    .describe("The behavioral diagram type when renderer is 'mermaid'; otherwise null."),
});

export type LegendEntry = z.infer<typeof legendEntrySchema>;
export type DiagramMetadata = z.infer<typeof metadataSchema>;
export type DiagramGroup = z.infer<typeof groupSchema>;
export type DiagramNode = z.infer<typeof nodeSchema>;
export type DiagramEdge = z.infer<typeof edgeSchema>;
export type Diagram = z.infer<typeof diagramSchema>;

/** A generated set of diagrams (progressive disclosure: e.g. context + container). */
export const diagramSetSchema = z.object({
  diagrams: z
    .array(diagramSchema)
    .describe(
      "One or more diagrams, ordered broad-to-narrow (e.g. context first, then container)."
    ),
});

export type DiagramSet = z.infer<typeof diagramSetSchema>;
