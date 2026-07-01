# Prompt → Diagram

Generate well-formed **architecture diagrams from a natural-language prompt**,
following the diagramming best practices from
[Lucid](https://lucid.co/blog/how-to-draw-architectural-diagrams) and the
[Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-diagrams).

You describe a system; Claude picks the right diagram type(s) and returns a
structured model that renders on an interactive canvas with official-style Azure
icons — or as a Mermaid diagram for behavioral views.

## What it does

- **Node/edge architecture diagrams** (context, container, component,
  deployment, network, data-flow) render on a **React Flow** canvas with:
  - Azure service icons, grouping boxes (VNet / subnet / resource group / trust
    boundary / layer), and automatic **ELK** layout.
  - Single-direction labeled arrows (solid = sync, dashed = async), a **legend**,
    and a **metadata header** (title / version / date / author) — the Azure WAF rules.
- **Behavioral diagrams** (sequence, state, ERD, flowchart, user journey) render
  as **Mermaid**.
- **Refine by prompt** — amend the current diagram ("add a Redis cache") and it
  updates in place.
- **Export** — PNG, SVG, and the underlying source (JSON or Mermaid).

## Setup

```bash
npm install
cp .env.local.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                         # http://localhost:3000
```

Get an API key at <https://console.anthropic.com/>. The default model is
`claude-opus-4-8`; override with `ANTHROPIC_MODEL` in `.env.local`.

## How it works

1. `POST /api/generate` sends the prompt (and, when refining, the current diagram
   set) to Claude with a system prompt that encodes the article rules and a
   whitelist of valid Azure service keys ([src/lib/prompt.ts](src/lib/prompt.ts)).
2. Claude returns the diagram set through a **forced tool call** whose schema is
   derived from the zod model ([src/lib/schema.ts](src/lib/schema.ts)). The
   response is validated with zod (one automatic repair round-trip on failure)
   and sanitized server-side ([src/app/api/generate/route.ts](src/app/api/generate/route.ts)).
3. The client lays out node/edge diagrams with ELK
   ([src/lib/layout.ts](src/lib/layout.ts)) and renders them
   ([src/components/DiagramCanvas.tsx](src/components/DiagramCanvas.tsx)), or
   renders Mermaid ([src/components/MermaidView.tsx](src/components/MermaidView.tsx)).

## Icons

The app uses Microsoft's official product icons:

- **Azure** architecture icons (`public/icons/azure/`) — from
  [benc-uk/icon-collection](https://github.com/benc-uk/icon-collection).
- **Power Platform** icons (`public/icons/powerplatform/`) — from
  [aidevme/microsoft-cloud-product-icons](https://github.com/aidevme/microsoft-cloud-product-icons).

These are Microsoft's icons and remain subject to
[Microsoft's icon terms](https://learn.microsoft.com/en-us/power-platform/guidance/icons)
(usable in architecture/solution diagrams). They are not part of this project's
own license.

Re-download or refresh the set any time with:

```bash
node scripts/fetch-icons.mjs
```

To add a service, add an entry to `SERVICES` in
[src/lib/services.ts](src/lib/services.ts) and map it to an icon file (extend
`scripts/fetch-icons.mjs` to pull it). The generic actor icons
(`generic_*.svg`) are simple local placeholders from
[scripts/gen-icons.mjs](scripts/gen-icons.mjs).

## Extending

- **More services:** add entries to `SERVICES` in
  [src/lib/services.ts](src/lib/services.ts) (and an icon file); they're
  automatically offered to the model.
- **AWS/GCP:** add new service keys + icon packs and adjust the system prompt.
