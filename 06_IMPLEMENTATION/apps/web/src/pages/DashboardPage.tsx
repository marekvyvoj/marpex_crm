import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider.tsx";
import { ScopeToggle } from "../components/ScopeToggle.tsx";
import { api } from "../lib/api.ts";
import { withViewScope, type ViewScope } from "../lib/view-scope.ts";

interface DashboardData {
  customerCount: number;
  totalPipeline: number;
  weightedPipeline: number;
  wonTotal: number;
  lostTotal: number;
  annualRevenueTarget: number | null;
  coverageRatio: number | null;
  openCount: number;
  visitCount: number;
  conversionRate: number;
  winRate: number;
  avgDealSize: number;
  crossSellRate: number | null;
  stagnantCount: number;
  overdueCount: number;
  lostReasons: Record<string, number>;
  plannerPreview: PlannerPreviewData | null;
  top10: { id: string; title: string; customerName: string; value: number; stage: string; nextStepSummary: string; nextStepDeadline: string; stagnant: boolean }[];
  semaphore: "OK" | "POZOR" | "RIZIKO";
}

interface PlannerPreviewData {
  summary: {
    overdueCount: number;
    dueTodayCount: number;
    dueThisWeekCount: number;
    laterCount: number;
    totalCount: number;
  };
  previewItems: {
    id: string;
    sourceType: "opportunity" | "visit";
    customerName: string;
    title: string;
    nextStep: string;
    dueDate: string;
    status: "overdue" | "today" | "this_week" | "later";
    stage: string | null;
    visitDate: string | null;
  }[];
}

const semaphoreColors = {
  OK: "bg-green-100 text-green-800",
  POZOR: "bg-yellow-100 text-yellow-800",
  RIZIKO: "bg-red-100 text-red-800",
};

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [scope, setScope] = useState<ViewScope>("mine");
  const requestedScope: ViewScope = user?.role === "sales" ? scope : "all";

  const { data, error, isError, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", requestedScope],
    queryFn: () => api(withViewScope("/dashboard", requestedScope)),
    enabled: !authLoading,
  });

  if (authLoading) return <p className="text-gray-400 text-sm">Načítavam dashboard…</p>;
  if (isLoading) return <p className="text-gray-400 text-sm">Načítavam dashboard…</p>;
  if (isError) return <p className="text-red-600 text-sm">{error instanceof Error ? error.message : "Dashboard sa nepodarilo načítať."}</p>;
  if (!data) return <p className="text-gray-400 text-sm">Dashboard nemá dostupné dáta.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${semaphoreColors[data.semaphore]}`}>
          {data.semaphore}
        </span>
      </div>

      {user?.role === "sales" && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Predvolený pohľad je len na vaše firmy a vaše čísla.</p>
            <p className="text-xs text-slate-500">Ak potrebujete, môžete si dočasne zobraziť aj portfólio ostatných obchodníkov.</p>
          </div>
          <ScopeToggle scope={scope} onChange={setScope} mineLabel="Moje portfólio" allLabel="Všetci obchodníci" />
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Zákazníci" value={String(data.customerCount)} />
        <KpiCard label="Pipeline total" value={`€ ${fmt(data.totalPipeline)}`} />
        <KpiCard label="Weighted pipeline" value={`€ ${fmt(data.weightedPipeline)}`} />
        <KpiCard label="Vyhraté" value={`€ ${fmt(data.wonTotal)}`} accent="green" />
        <KpiCard label="Prehraté" value={`€ ${fmt(data.lostTotal)}`} accent="red" />
        <KpiCard label="Ročný target" value={data.annualRevenueTarget ? `€ ${fmt(data.annualRevenueTarget)}` : "N/A"} />
        <KpiCard label="Coverage ratio" value={data.coverageRatio !== null ? `${data.coverageRatio.toFixed(2)}x` : "N/A"} accent={data.coverageRatio !== null && data.coverageRatio < 3 ? "red" : undefined} />
        <KpiCard label="Otvorené príl." value={String(data.openCount)} />
        <KpiCard label="Návštevy" value={String(data.visitCount)} />
        <KpiCard label="Conversion" value={`${data.conversionRate} %`} />
        <KpiCard label="Win rate" value={`${data.winRate} %`} />
        <KpiCard label="Avg deal size" value={`€ ${fmt(data.avgDealSize)}`} />
        <KpiCard label="Cross-sell" value={data.crossSellRate !== null ? `${data.crossSellRate} %` : "N/A"} />
        <KpiCard label="Stagnujúce" value={String(data.stagnantCount)} accent={data.stagnantCount > 0 ? "red" : undefined} />
        <KpiCard label="Overdue príležitosti" value={String(data.overdueCount)} accent={data.overdueCount > 0 ? "red" : undefined} />
      </div>

      {data.plannerPreview && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-sm">Môj plán práce na najbližší týždeň</h3>
              <p className="text-xs text-gray-500">Všetky moje next stepy po termíne, dnes a do 7 dní na jednom mieste.</p>
            </div>
            <Link to="/planner" className="text-sm font-medium text-blue-700 hover:underline">
              Otvoriť plán práce
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Po termíne" value={String(data.plannerPreview.summary.overdueCount)} tone="red" />
            <MiniStat label="Dnes" value={String(data.plannerPreview.summary.dueTodayCount)} tone="blue" />
            <MiniStat label="Do 7 dní" value={String(data.plannerPreview.summary.dueThisWeekCount)} tone="amber" />
          </div>

          {data.plannerPreview.previewItems.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Najbližší týždeň je zatiaľ bez naplánovaných next stepov.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {data.plannerPreview.previewItems.map((item) => (
                <Link
                  key={`${item.sourceType}-${item.id}`}
                  to={item.sourceType === "opportunity" ? `/pipeline/${item.id}` : `/visits/${item.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {item.sourceType === "opportunity" ? "Príležitosť" : "Návšteva"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.customerName}</p>
                    <p className="mt-1 text-sm text-gray-700">{item.nextStep}</p>
                  </div>
                  <div className="text-sm text-gray-500 sm:text-right">
                    <p className="font-medium text-gray-700">{formatDate(item.dueDate)}</p>
                    <p>{item.stage ?? (item.visitDate ? `Návšteva ${formatDate(item.visitDate)}` : "")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Top 10 deals */}
      <h3 className="font-bold text-sm mb-2">Top 10 otvorené príležitosti</h3>
      {data.top10.length === 0 ? (
        <p className="text-gray-400 text-sm">Žiadne otvorené príležitosti.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] bg-white rounded-lg border border-gray-200 text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-3 py-2">Názov</th>
                <th className="px-3 py-2 text-right">Hodnota</th>
                <th className="px-3 py-2">Fáza</th>
                <th className="px-3 py-2">Next step</th>
                <th className="px-3 py-2">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {data.top10.map((o) => (
                <tr key={o.id} className={`border-b border-gray-100 ${o.stagnant ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-gray-400">{o.customerName}</p>
                  </td>
                  <td className="px-3 py-2 text-right">€ {fmt(o.value)}</td>
                  <td className="px-3 py-2">{o.stage}</td>
                  <td className="px-3 py-2 truncate max-w-[200px]">{o.nextStepSummary}</td>
                  <td className="px-3 py-2">{o.nextStepDeadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lost reasons */}
      {Object.keys(data.lostReasons).length > 0 && (
        <>
          <h3 className="font-bold text-sm mb-2">Dôvody prehier</h3>
          <div className="flex gap-3 flex-wrap mb-6">
            {Object.entries(data.lostReasons).map(([reason, count]) => (
              <span key={reason} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                {reason}: {count}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: "green" | "red" }) {
  const colorClass = accent === "green"
    ? "text-green-700"
    : accent === "red"
      ? "text-red-700"
      : "text-gray-900";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "red" | "blue" | "amber" }) {
  const toneClass = tone === "red"
    ? "text-red-700 bg-red-50 border-red-100"
    : tone === "blue"
      ? "text-blue-700 bg-blue-50 border-blue-100"
      : "text-amber-700 bg-amber-50 border-amber-100";

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

const statusLabel = {
  overdue: "Po termíne",
  today: "Dnes",
  this_week: "Do 7 dní",
  later: "Neskôr",
};

const statusBadgeClass = {
  overdue: "bg-red-100 text-red-700",
  today: "bg-blue-100 text-blue-700",
  this_week: "bg-amber-100 text-amber-700",
  later: "bg-gray-100 text-gray-600",
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("sk-SK");
}

function fmt(n: number) {
  return n.toLocaleString("sk-SK", { maximumFractionDigits: 0 });
}
