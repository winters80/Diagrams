import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  diagramSetSchema,
  type Diagram,
  type DiagramSet,
} from "@/lib/schema";
import { SERVICES, GENERIC_FALLBACK } from "@/lib/services";
import { buildSystemPrompt, DIAGRAM_MODEL } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOOL_NAME = "emit_diagrams";

// Approximate list prices in USD per million tokens (input / output).
// Cache reads bill ~0.1x input; cache writes ~1.25x input.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-4-6": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

function estimateCostUsd(model: string, u: UsageTotals): number | null {
  const p = PRICING[model];
  if (!p) return null;
  const cost =
    (u.inputTokens * p.in +
      u.outputTokens * p.out +
      u.cacheReadTokens * p.in * 0.1 +
      u.cacheCreationTokens * p.in * 1.25) /
    1_000_000;
  return Math.round(cost * 1e6) / 1e6;
}

// Build the tool input schema once from the zod model.
const inputSchema = zodToJsonSchema(diagramSetSchema, {
  target: "openApi3",
  $refStrategy: "none",
}) as Record<string, unknown>;

interface GenerateBody {
  prompt: string;
  /** When refining, the current diagram set is passed back for amendment. */
  current?: DiagramSet | null;
}

/**
 * Server-side cleanup: guarantees the rendered diagram is internally consistent
 * even if the model drifts. Unknown service keys fall back to a generic block,
 * and edges pointing at non-existent nodes are dropped rather than crashing the
 * canvas.
 */
function sanitize(set: DiagramSet): DiagramSet {
  const diagrams = set.diagrams.map((d: Diagram): Diagram => {
    if (d.renderer === "mermaid") return d;

    const nodes = d.nodes.map((n) => ({
      ...n,
      service: SERVICES[n.service] ? n.service : GENERIC_FALLBACK,
    }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const groupIds = new Set(d.groups.map((g) => g.id));

    const groups = d.groups.map((g) => ({
      ...g,
      parentId: g.parentId && groupIds.has(g.parentId) ? g.parentId : null,
    }));
    const cleanedNodes = nodes.map((n) => ({
      ...n,
      groupId: n.groupId && groupIds.has(n.groupId) ? n.groupId : null,
    }));
    const edges = d.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { ...d, nodes: cleanedNodes, groups, edges };
  });

  return { diagrams };
}

function extractToolInput(message: Anthropic.Message): unknown | null {
  for (const block of message.content) {
    if (block.type === "tool_use" && block.name === TOOL_NAME) {
      return block.input;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local." },
      { status: 500 }
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);

  const userContent = body.current
    ? `Here is the current diagram set as JSON. Amend it per the instruction below and return the full updated set.\n\nCURRENT:\n${JSON.stringify(
        body.current
      )}\n\nINSTRUCTION:\n${prompt}`
    : prompt;

  const tools: Anthropic.Tool[] = [
    {
      name: TOOL_NAME,
      description:
        "Emit the generated architecture diagram set. Call this exactly once with the full set.",
      input_schema: inputSchema as Anthropic.Tool.InputSchema,
    },
  ];

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userContent },
  ];

  const usage: UsageTotals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };

  try {
    // Up to two attempts: one repair round-trip if zod validation fails.
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: DIAGRAM_MODEL,
        max_tokens: 8000,
        system: buildSystemPrompt(today),
        tools,
        tool_choice: { type: "tool", name: TOOL_NAME },
        messages,
      });

      // Accumulate token usage across all attempts in this generation.
      usage.inputTokens += response.usage.input_tokens;
      usage.outputTokens += response.usage.output_tokens;
      usage.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
      usage.cacheCreationTokens += response.usage.cache_creation_input_tokens ?? 0;

      const raw = extractToolInput(response);
      const parsed = diagramSetSchema.safeParse(raw);

      if (parsed.success) {
        return NextResponse.json({
          ...sanitize(parsed.data),
          usage: {
            ...usage,
            model: DIAGRAM_MODEL,
            estimatedCostUsd: estimateCostUsd(DIAGRAM_MODEL, usage),
          },
        });
      }

      // Feed the validation error back for one repair attempt.
      const toolUse = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse?.id ?? "unknown",
            is_error: true,
            content: `The diagram did not validate. Fix these issues and call ${TOOL_NAME} again:\n${JSON.stringify(
              parsed.error.issues.slice(0, 12)
            )}`,
          },
        ],
      });
    }

    return NextResponse.json(
      { error: "The model did not return a valid diagram. Try rephrasing." },
      { status: 502 }
    );
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error (${err.status}): ${err.message}`
        : err instanceof Error
        ? err.message
        : "Unknown error generating the diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
