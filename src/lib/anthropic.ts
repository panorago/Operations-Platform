import { isPreview } from "./runtime";
import type { Product } from "../types";
export async function getReorderSuggestions(
  _stockData: Product[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
) {
  if (isPreview)
    throw Error(
      "Live AI is not connected in the browser preview. Use the full server deployment for live recommendations.",
    );
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) {
    const data = (await response.json()) as { error: string };
    throw Error(data.error);
  }
  if (!response.body) throw Error("No response stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "",
    text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const event = JSON.parse(line.slice(6)) as {
        type: string;
        delta?: { type: string; text?: string };
        error?: { message: string };
      };
      if (event.type === "error")
        throw Error(event.error?.message || "AI stream failed");
      if (event.delta?.type === "text_delta") {
        text += event.delta.text || "";
        onChunk(text);
      }
    }
  }
  if (!text) throw Error("No recommendation returned");
  return text;
}
