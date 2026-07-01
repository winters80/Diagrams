import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";
import type { Diagram } from "./schema";

const elk = new ELK();

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 92;

const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
  "elk.spacing.nodeNode": "50",
  "elk.padding": "[top=44,left=24,bottom=24,right=24]",
};

/**
 * Runs ELK on the diagram's groups/nodes/edges and returns positioned React Flow
 * nodes and edges. Groups become React Flow parent nodes so containers (VNets,
 * subnets, layers, trust boundaries) render as labeled boxes around their nodes.
 */
export async function layoutDiagram(
  diagram: Diagram
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const childrenOfGroup = new Map<string | null, ElkNode[]>();
  const push = (parent: string | null, child: ElkNode) => {
    const list = childrenOfGroup.get(parent) ?? [];
    list.push(child);
    childrenOfGroup.set(parent, list);
  };

  // Group containers (may nest via parentId).
  for (const g of diagram.groups) {
    push(g.parentId, {
      id: g.id,
      layoutOptions,
      children: [],
      labels: [{ text: g.label }],
    } as ElkNode);
  }
  // Attach child groups to their parents.
  const groupById = new Map<string, ElkNode>();
  for (const list of childrenOfGroup.values()) {
    for (const n of list) groupById.set(n.id, n);
  }
  for (const g of diagram.groups) {
    if (g.parentId && groupById.has(g.parentId)) {
      const parent = groupById.get(g.parentId)!;
      const self = groupById.get(g.id)!;
      parent.children = parent.children ?? [];
      parent.children.push(self);
    }
  }

  // Service nodes.
  for (const n of diagram.nodes) {
    const child: ElkNode = {
      id: n.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    if (n.groupId && groupById.has(n.groupId)) {
      const parent = groupById.get(n.groupId)!;
      parent.children = parent.children ?? [];
      parent.children.push(child);
    } else {
      push(null, child);
    }
  }

  const topLevel = childrenOfGroup.get(null) ?? [];

  const elkEdges: ElkExtendedEdge[] = diagram.edges.map((e, i) => ({
    id: `e${i}`,
    sources: [e.source],
    targets: [e.target],
  }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      ...layoutOptions,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
    children: topLevel,
    edges: elkEdges,
  };

  const laidOut = await elk.layout(graph);

  const rfNodes: Node[] = [];

  const groupLabel = new Map(diagram.groups.map((g) => [g.id, g]));
  const nodeById = new Map(diagram.nodes.map((n) => [n.id, n]));

  const walk = (elkNode: ElkNode, parentId?: string) => {
    for (const child of elkNode.children ?? []) {
      const isGroup = groupLabel.has(child.id);
      if (isGroup) {
        const g = groupLabel.get(child.id)!;
        rfNodes.push({
          id: child.id,
          type: "groupBox",
          position: { x: child.x ?? 0, y: child.y ?? 0 },
          data: { label: g.label, kind: g.kind },
          style: { width: child.width ?? 200, height: child.height ?? 160 },
          ...(parentId ? { parentId, extent: "parent" as const } : {}),
        });
        walk(child, child.id);
      } else {
        const n = nodeById.get(child.id);
        if (!n) continue;
        rfNodes.push({
          id: child.id,
          type: "service",
          position: { x: child.x ?? 0, y: child.y ?? 0 },
          data: { label: n.label, service: n.service, sublabel: n.sublabel },
          ...(parentId ? { parentId, extent: "parent" as const } : {}),
        });
      }
    }
  };
  walk(laidOut);

  // Groups must precede their children in the array for React Flow parenting.
  rfNodes.sort((a, b) => (a.type === "groupBox" ? -1 : 0) - (b.type === "groupBox" ? -1 : 0));

  const rfEdges: Edge[] = diagram.edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    label: e.protocol ? `${e.label} (${e.protocol})` : e.label,
    animated: e.style === "async",
    markerEnd: { type: "arrowclosed" as const, color: "#5A5A5A" },
    style: {
      stroke: "#5A5A5A",
      strokeDasharray: e.style === "async" ? "6 4" : undefined,
    },
    labelStyle: { fontSize: 11, fill: "#333" },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.85 },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}
