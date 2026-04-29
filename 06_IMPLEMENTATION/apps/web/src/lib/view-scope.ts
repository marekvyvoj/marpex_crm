export type ViewScope = "mine" | "all";

export function withViewScope(path: string, scope: ViewScope) {
  if (scope === "mine") {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}scope=all`;
}