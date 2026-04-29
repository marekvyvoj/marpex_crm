import type { ViewScope } from "../lib/view-scope.ts";

export function ScopeToggle({
  scope,
  onChange,
  mineLabel,
  allLabel,
}: {
  scope: ViewScope;
  onChange: (scope: ViewScope) => void;
  mineLabel: string;
  allLabel: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm shadow-sm">
      <button
        type="button"
        onClick={() => onChange("mine")}
        aria-pressed={scope === "mine"}
        className={`rounded-full px-3 py-1.5 font-medium transition ${scope === "mine" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
      >
        {mineLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("all")}
        aria-pressed={scope === "all"}
        className={`rounded-full px-3 py-1.5 font-medium transition ${scope === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
      >
        {allLabel}
      </button>
    </div>
  );
}