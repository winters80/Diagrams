"use client";

import { useState } from "react";

const EXAMPLES = [
  "A web app on Azure App Service behind Front Door, with SQL Database and Blob Storage, all in a VNet.",
  "Event-driven order processing: API Management, Functions, Service Bus, Cosmos DB, and Event Grid.",
  "Sequence diagram for a user placing an order through the checkout API.",
];

export default function PromptPanel({
  onSubmit,
  loading,
  hasDiagram,
  error,
}: {
  onSubmit: (prompt: string, refine: boolean) => void;
  loading: boolean;
  hasDiagram: boolean;
  error: string | null;
}) {
  const [prompt, setPrompt] = useState("");

  const submit = (refine: boolean) => {
    const p = prompt.trim();
    if (!p || loading) return;
    onSubmit(p, refine);
    setPrompt("");
  };

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-800">Prompt → Diagram</h1>
        <p className="text-xs text-gray-500">
          Describe an architecture. Follows Azure Well-Architected diagramming rules.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">
          {hasDiagram ? "Refine or describe a new diagram" : "Describe your system"}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(hasDiagram);
          }}
          rows={6}
          placeholder="e.g. A three-tier web app on Azure with App Service, SQL Database and Redis cache in a VNet."
          className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-azure"
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => submit(false)}
            disabled={loading}
            className="flex-1 rounded-md bg-azure px-3 py-2 text-sm font-medium text-white hover:bg-azure-dark disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
          {hasDiagram && (
            <button
              onClick={() => submit(true)}
              disabled={loading}
              className="flex-1 rounded-md border border-azure px-3 py-2 text-sm font-medium text-azure hover:bg-blue-50 disabled:opacity-50"
              title="Amend the current diagram with this instruction"
            >
              Refine
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">Tip: ⌘/Ctrl + Enter to submit.</p>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 text-xs font-medium text-gray-500">Try an example</div>
          <div className="space-y-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                disabled={loading}
                className="block w-full rounded-md border border-gray-200 p-2 text-left text-xs text-gray-600 hover:border-azure hover:bg-blue-50 disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
