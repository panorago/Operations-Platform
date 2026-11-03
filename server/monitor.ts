import { createHash } from "node:crypto";
import type { AppState, MonitorState } from "../src/types";
import { today } from "../src/lib/utils";
import { scanOperations } from "../src/lib/monitoring";
export function monitorSnapshot(
  state: AppState,
  cached: Partial<MonitorState> = {},
): MonitorState {
  return {
    providerConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    providerReady:
      Boolean(process.env.ANTHROPIC_API_KEY) &&
      Boolean(cached.analyzedAt) &&
      cached.status !== "error",
    automatic: state.settings.monitoring?.enabled !== false,
    status: !process.env.ANTHROPIC_API_KEY
      ? "local"
      : state.settings.monitoring?.enabled === false
        ? "paused"
        : cached.status === "error"
          ? "error"
          : "watching",
    summary: cached.summary || null,
    analyzedAt: cached.analyzedAt,
    error: cached.error,
    checkedAt: new Date().toISOString(),
    issues: scanOperations(state),
  };
}
export function monitorFingerprint(state: AppState) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        calendarDate: today(),
        suppliers: state.suppliers.map((s) => [
          s.id,
          s.creditLimit,
          s.creditUsed,
        ]),
        products: state.products.map((p) => [p.id, p.stock]),
        invoices: state.invoices.map((i) => [i.id, i.paid, i.amount]),
        orders: state.orders.slice(0, 25).map((o) => [o.id, o.status]),
        trucks: state.trucks.map((t) => [t.id, t.delayed]),
      }),
    )
    .digest("hex");
}
export async function analyseOperations(
  state: AppState,
  request: typeof fetch = fetch,
): Promise<MonitorState> {
  if (!process.env.ANTHROPIC_API_KEY)
    throw Error(
      "AI is not connected. Configure ANTHROPIC_API_KEY securely on the server.",
    );
  const issues = scanOperations(state);
  const response = await request("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system:
        "You monitor FreshMark Retail Zimbabwe operations. Use ONLY the provided facts. Give 3 concise actionable sentences covering the highest inventory, credit and delivery risks. Include product names and reorder quantities. Distinguish simulated fleet data. Do not invent events, sales, payments or completed actions. You advise; you do not place orders or change data.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            issues,
            orders: state.orders
              .slice(0, 10)
              .map((o) => ({ id: o.id, status: o.status, total: o.total })),
            suppliers: state.suppliers.map((s) => ({
              name: s.name,
              creditAvailable: s.creditLimit - s.creditUsed,
            })),
            fleetSimulated: true,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok)
    throw Error(
      `AI provider returned ${response.status}. Monitoring continues locally.`,
    );
  const result = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = result.content
    ?.filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("\n");
  if (!text) throw Error("AI provider returned no analysis.");
  return {
    ...monitorSnapshot(state),
    summary: text,
    analyzedAt: new Date().toISOString(),
    providerConfigured: true,
    providerReady: true,
    status:
      state.settings.monitoring?.enabled === false ? "paused" : "watching",
  };
}
