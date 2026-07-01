"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagram } from "@/lib/schema";

let mermaidInitialized = false;

export default function MermaidView({
  diagram,
  onSvgRef,
}: {
  diagram: Diagram;
  onSvgRef?: (svg: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const source = diagram.mermaid ?? "";

    async function render() {
      setError(null);
      const mermaid = (await import("mermaid")).default;
      if (!mermaidInitialized) {
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
        mermaidInitialized = true;
      }
      try {
        const id = "mmd-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, source);
        if (cancelled) return;
        if (containerRef.current) containerRef.current.innerHTML = svg;
        onSvgRef?.(svg);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to render Mermaid diagram.");
        onSvgRef?.(null);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [diagram, onSvgRef]);

  return (
    <div className="relative h-full w-full overflow-auto bg-white">
      <div className="absolute left-3 top-3 z-10 rounded-md border border-gray-200 bg-white/90 px-3 py-2 shadow-sm max-w-md">
        <div className="text-sm font-semibold text-gray-800">{diagram.metadata.title}</div>
        <div className="text-[11px] text-gray-500">{diagram.metadata.description}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
          {diagram.mermaidType ?? "diagram"} · v{diagram.metadata.version} ·{" "}
          {diagram.metadata.lastUpdated} · {diagram.metadata.author}
        </div>
      </div>
      {error ? (
        <div className="p-6 text-sm text-red-600">
          <p className="font-semibold">Could not render diagram.</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-500">{error}</pre>
        </div>
      ) : (
        <div ref={containerRef} className="flex items-center justify-center p-10 pt-20" />
      )}
    </div>
  );
}
