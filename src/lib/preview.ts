import { scanOperations } from "./monitoring";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { seed } from "../data";
import { applyCommand } from "./domain";
import type { AppState, Command, User } from "../types";
const key = "venda-pages-preview-v1";
const user: User = {
  id: "preview-admin",
  name: "Dylan",
  email: "preview@freshmark.example",
  role: "Admin",
  status: "Active",
};
type SavedPreview = { version: 1; state: AppState; users: User[] };
const fresh = (): SavedPreview => ({
  version: 1,
  state: structuredClone(seed),
  users: [user],
});
function load(): SavedPreview {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as SavedPreview;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.state?.products) ||
      !Array.isArray(parsed.users)
    )
      return fresh();
    parsed.users = parsed.users.map((u) =>
      u.id === user.id ? { ...u, name: user.name } : u,
    );
    return parsed;
  } catch {
    return fresh();
  }
}
function save(data: SavedPreview) {
  localStorage.setItem(key, JSON.stringify(data));
}
export function resetPreview() {
  localStorage.removeItem(key);
  localStorage.removeItem("venda-cart");
}
export async function previewAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const response = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: status === 200 ? "OK" : "Request failed",
    headers: new AxiosHeaders(),
    config,
  });
  try {
    const saved = load();
    const body = (
      typeof config.data === "string" ? JSON.parse(config.data) : config.data
    ) as Record<string, unknown> | undefined;
    if (config.url === "/auth")
      return response({ needsSetup: false, setupProtected: false, user });
    if (config.url === "/health") return response({ status: "preview" });
    if (config.url === "/state") return response(saved.state);
    if (config.url === "/monitor")
      return response({
        providerReady: false,
        providerConfigured: false,
        automatic: false,
        status: "local",
        summary: null,
        checkedAt: new Date().toISOString(),
        issues: scanOperations(saved.state),
      });
    if (config.url === "/monitor/analyze")
      throw Error(
        "Live AI needs the connected server workspace. Local monitoring remains active.",
      );
    if (config.url === "/commands") {
      const command = body as unknown as Command;
      if (!command || typeof command.type !== "string")
        throw Error("Invalid preview action");
      saved.state = applyCommand(saved.state, command, "Admin");
      save(saved);
      return response(saved.state);
    }
    if (config.url === "/users") {
      if (config.method === "get") return response(saved.users);
      if (
        !body ||
        typeof body.name !== "string" ||
        typeof body.email !== "string" ||
        !["Admin", "Operations", "Finance"].includes(String(body.role))
      )
        throw Error("Enter a name, email and valid role.");
      if (saved.users.some((u) => u.email === body.email))
        throw Error("This email is already in the preview team.");
      saved.users.push({
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        role: body.role as User["role"],
        status: "Active",
      });
      save(saved);
      return response({ ok: true });
    }
    if (config.url === "/logout" || config.url === "/login")
      return response({ ok: true });
    throw Error("This action needs the full server deployment.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Preview action failed";
    throw new AxiosError(
      message,
      "ERR_BAD_REQUEST",
      config,
      undefined,
      response({ error: message }, 400),
    );
  }
}
