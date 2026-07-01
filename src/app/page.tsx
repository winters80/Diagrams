"use client";

import { useCallback, useRef, useState } from "react";
import PromptPanel from "@/components/PromptPanel";
import DiagramCanvas from "@/components/DiagramCanvas";
import MermaidView from "@/components/MermaidView";
import type { DiagramSet } from "@/lib/schema";
import {
  downloadText,
  exportElementPng,
  exportElementSvg,
  downloadSvgString,
  pngFromSvgString,
  slugify,
} from "@/lib/export";

export default function Home() {
  const [set, setSet] = useState<DiagramSet | null>(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export targets for the active diagram.
  const canvasElRef = useRef<HTMLDivElement | null>(null);
  const mermaidSvgRef = useRef<string | null>(null);

  const generate = useCallback(
    async (prompt: string, refine: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, current: refine ? set : null }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Generation failed.");
          return;
        }
        setSet(data as DiagramSet);
        setActive(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error.");
      } finally {
        setLoading(false);
      }
    },
    [set]
  );

  const diagram = set?.diagrams[active] ?? null;
  const baseName = diagram ? slugify(diagram.metadata.title) : "diagram";

  const onPng = async () => {
    if (!diagram) return;
    if (diagram.renderer === "mermaid") {
      if (mermaidSvgRef.current) pngFromSvgString(mermaidSvgRef.current, `${baseName}.png`);
    } else if (canvasElRef.current) {
      await exportElementPng(canvasElRef.current, `${baseName}.png`);
    }
  };
  const onSvg = async () => {
    if (!diagram) return;
    if (diagram.renderer === "mermaid") {
      if (mermaidSvgRef.current) downloadSvgString(mermaidSvgRef.current, `${baseName}.svg`);
    } else if (canvasElRef.current) {
      await exportElementSvg(canvasElRef.current, `${baseName}.svg`);
    }
  };
  const onSource = () => {
    if (!diagram) return;
    if (diagram.renderer === "mermaid") {
      downloadText(diagram.mermaid ?? "", `${baseName}.mmd`, "text/plain");
    } else {
      downloadText(JSON.stringify(diagram, null, 2), `${baseName}.json`);
    }
  };

  return (
    <div className="grid h-full grid-cols-[340px_1fr]">
      <PromptPanel
        onSubmit={generate}
        loading={loading}
        hasDiagram={!!set}
        error={error}
      />

      <div className="flex h-full flex-col">
        {/* Tabs + export toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {set?.diagrams.map((d, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                  i === active
                    ? "bg-azure text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.metadata.title}
              </button>
            ))}
            {!set && <span className="px-2 py-1.5 text-xs text-gray-400">No diagram yet</span>}
          </div>

          {diagram && (
            <div className="flex shrink-0 gap-2">
              <button onClick={onPng} className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
                PNG
              </button>
              <button onClick={onSvg} className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
                SVG
              </button>
              <button onClick={onSource} className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
                Source
              </button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="relative flex-1 bg-gray-50">
          {!diagram && (
            <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
              <div>
                <p className="text-base font-medium text-gray-500">
                  Describe an architecture to generate a diagram.
                </p>
                <p className="mt-1">Node/edge diagrams get official Azure icons; behavioral ones render as Mermaid.</p>
              </div>
            </div>
          )}
          {diagram && diagram.renderer === "diagram" && (
            <DiagramCanvas
              key={`${active}-${diagram.metadata.version}-${diagram.metadata.title}`}
              diagram={diagram}
              onExportRef={(el) => (canvasElRef.current = el)}
            />
          )}
          {diagram && diagram.renderer === "mermaid" && (
            <MermaidView
              key={`${active}-${diagram.metadata.version}-${diagram.metadata.title}`}
              diagram={diagram}
              onSvgRef={(svg) => (mermaidSvgRef.current = svg)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
