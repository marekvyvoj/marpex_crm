import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

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
  top10: { id: string; title: string; customerName: string; value: number; stage: string; nextStepSummary: string; nextStepDeadline: string; stagnant: boolean }[];
  semaphore: "OK" | "POZOR" | "RIZIKO";
}

const semaphoreColors = {
  OK: "bg-green-100 text-green-800",
  POZOR: "bg-yellow-100 text-yellow-800",
  RIZIKO: "bg-red-100 text-red-800",
};

export function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard"),
  });

  if (isLoading || !data) return <p className="text-gray-400 text-sm">Načítavam dashboard…</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${semaphoreColors[data.semaphore]}`}>
          {data.semaphore}
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        <KpiCard label="Overdue next steps" value={String(data.overdueCount)} accent={data.overdueCount > 0 ? "red" : undefined} />
      </div>

      {/* Top 10 deals */}
      <h3 className="font-bold text-sm mb-2">Top 10 otvorené príležitosti</h3>
      {data.top10.length === 0 ? (
        <p className="text-gray-400 text-sm">Žiadne otvorené príležitosti.</p>
      ) : (
        <table className="w-full bg-white rounded-lg border border-gray-200 text-sm mb-6">
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

function fmt(n: number) {
  return n.toLocaleString("sk-SK", { maximumFractionDigits: 0 });
}
