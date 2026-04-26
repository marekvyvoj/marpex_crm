import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider.tsx";
import { api } from "../lib/api.ts";

interface SalespersonRow {
  userId: string;
  name: string;
  email: string;
  active: boolean;
  visitCount: number;
  lateVisits: number;
  conversionRate: number | null;
  openOpps: number;
  openValue: number;
  weightedPipeline: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  winRate: number | null;
  stagnantCount: number;
  overdueCount: number;
}

function fmt(n: number) {
  return `€ ${n.toLocaleString("sk-SK")}`;
}

function pct(n: number | null) {
  if (n == null) return "–";
  return `${n} %`;
}

function risk(row: SalespersonRow) {
  if (row.stagnantCount >= 2 || row.overdueCount >= 3) return "high";
  if (row.stagnantCount >= 1 || row.overdueCount >= 1) return "medium";
  return "ok";
}

export function ReportPage() {
  const { user } = useAuth();

  const { data: rows = [], isLoading } = useQuery<SalespersonRow[]>({
    queryKey: ["report-salesperson"],
    queryFn: () => api("/report/salesperson"),
  });

  if (user?.role !== "manager") {
    return <p className="text-red-600 text-sm">Prístup zamietnutý — len manažér.</p>;
  }

  const totalOpens = rows.reduce((s, r) => s + r.openValue, 0);
  const totalWeighted = rows.reduce((s, r) => s + r.weightedPipeline, 0);
  const totalWon = rows.reduce((s, r) => s + r.wonValue, 0);
  const totalVisits = rows.reduce((s, r) => s + r.visitCount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-5">Report obchodníkov</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{totalVisits}</p>
          <p className="text-xs text-gray-500">Návštevy celkom</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-purple-600">{fmt(totalOpens)}</p>
          <p className="text-xs text-gray-500">Open pipeline</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-indigo-600">{fmt(totalWeighted)}</p>
          <p className="text-xs text-gray-500">Weighted pipeline</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-600">{fmt(totalWon)}</p>
          <p className="text-xs text-gray-500">Won celkom</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Načítavam…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">Žiadni obchodníci.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full bg-white border border-gray-200 rounded-lg text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 bg-gray-50">
                <th className="px-4 py-2">Obchodník</th>
                <th className="px-3 py-2 text-center">Návštevy</th>
                <th className="px-3 py-2 text-center">Oneskorené</th>
                <th className="px-3 py-2 text-center">Konverzia</th>
                <th className="px-3 py-2 text-right">Open opps</th>
                <th className="px-3 py-2 text-right">Open hodnota</th>
                <th className="px-3 py-2 text-right">Weighted</th>
                <th className="px-3 py-2 text-center">Won</th>
                <th className="px-3 py-2 text-right">Won hodnota</th>
                <th className="px-3 py-2 text-center">Win rate</th>
                <th className="px-3 py-2 text-center">Stagnuje</th>
                <th className="px-3 py-2 text-center">Overdue</th>
                <th className="px-3 py-2 text-center">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const riskLevel = risk(r);
                return (
                  <tr
                    key={r.userId}
                    className={`border-b border-gray-100 ${!r.active ? "opacity-40" : riskLevel === "high" ? "bg-red-50" : riskLevel === "medium" ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-4 py-2">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-3 py-2 text-center font-medium">{r.visitCount}</td>
                    <td className="px-3 py-2 text-center">
                      {r.lateVisits > 0 ? (
                        <span className="text-red-600 font-medium">{r.lateVisits}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">{pct(r.conversionRate)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.openOpps}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.openValue)}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.weightedPipeline)}</td>
                    <td className="px-3 py-2 text-center text-green-700 font-medium">{r.wonCount}</td>
                    <td className="px-3 py-2 text-right text-green-700">{fmt(r.wonValue)}</td>
                    <td className="px-3 py-2 text-center">{pct(r.winRate)}</td>
                    <td className="px-3 py-2 text-center">
                      {r.stagnantCount > 0 ? <span className="text-amber-600 font-medium">{r.stagnantCount}</span> : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.overdueCount > 0 ? <span className="text-red-600 font-medium">{r.overdueCount}</span> : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {riskLevel === "high" && <span className="text-xs font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">RIZIKO</span>}
                      {riskLevel === "medium" && <span className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">POZOR</span>}
                      {riskLevel === "ok" && <span className="text-xs text-green-600">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
