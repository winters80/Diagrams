"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Diagram } from "@/lib/schema";
import { getService } from "@/lib/services";
import { layoutDiagram } from "@/lib/layout";

const GROUP_STYLES: Record<string, { border: string; bg: string; label: string }> = {
  vnet: { border: "#0078D4", bg: "rgba(0,120,212,0.05)", label: "#0078D4" },
  subnet: { border: "#50B0F0", bg: "rgba(80,176,240,0.06)", label: "#005A9E" },
  resourceGroup: { border: "#7A7A7A", bg: "rgba(120,120,120,0.05)", label: "#555" },
  trustBoundary: { border: "#C1121F", bg: "rgba(193,18,31,0.04)", label: "#C1121F" },
  layer: { border: "#6B48A8", bg: "rgba(107,72,168,0.05)", label: "#6B48A8" },
};

function ServiceNode({ data }: NodeProps) {
  const service = getService(String(data.service));
  return (
    <div className="rounded-md border border-gray-300 bg-white shadow-sm px-3 py-2 w-[190px]">
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={service.icon} alt="" width={28} height={28} className="shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight text-gray-800 truncate">
            {String(data.label)}
          </div>
          {data.sublabel ? (
            <div className="text-[11px] text-gray-500 truncate">{String(data.sublabel)}</div>
          ) : null}
          <div className="text-[10px] text-azure-dark truncate">{service.displayName}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  );
}

function GroupBoxNode({ data }: NodeProps) {
  const style = GROUP_STYLES[String(data.kind)] ?? GROUP_STYLES.layer;
  return (
    <div
      className="h-full w-full rounded-lg border-2"
      style={{ borderColor: style.border, background: style.bg, borderStyle: "dashed" }}
    >
      <div
        className="absolute -top-0 left-0 px-2 py-0.5 text-[11px] font-semibold rounded-br-md"
        style={{ color: style.label }}
      >
        {String(data.label)}
      </div>
    </div>
  );
}

const nodeTypes = { service: ServiceNode, groupBox: GroupBoxNode };

export default function DiagramCanvas({
  diagram,
  onExportRef,
}: {
  diagram: Diagram;
  onExportRef?: (el: HTMLDivElement | null) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    layoutDiagram(diagram).then(({ nodes, edges }) => {
      if (cancelled) return;
      setNodes(nodes);
      setEdges(edges);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [diagram, setNodes, setEdges]);

  const captureRef = useCallback(
    (el: HTMLDivElement | null) => {
      onExportRef?.(el);
    },
    [onExportRef]
  );

  const legend = diagram.metadata.legend;

  return (
    <div className="relative h-full w-full" ref={captureRef}>
      {/* Metadata header (WAF: title/version/date/author) */}
      <div className="absolute left-3 top-3 z-10 rounded-md border border-gray-200 bg-white/90 px-3 py-2 shadow-sm max-w-md">
        <div className="text-sm font-semibold text-gray-800">{diagram.metadata.title}</div>
        <div className="text-[11px] text-gray-500">{diagram.metadata.description}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
          {diagram.metadata.diagramType} · v{diagram.metadata.version} ·{" "}
          {diagram.metadata.lastUpdated} · {diagram.metadata.author}
        </div>
      </div>

      {/* Legend */}
      {legend.length > 0 && (
        <div className="absolute right-3 bottom-3 z-10 rounded-md border border-gray-200 bg-white/90 px-3 py-2 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Legend
          </div>
          {legend.map((l, i) => (
            <div key={i} className="text-[11px] text-gray-600">
              <span className="font-medium">{l.label}</span> — {l.meaning}
            </div>
          ))}
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-sm text-gray-400">
          Laying out diagram…
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
