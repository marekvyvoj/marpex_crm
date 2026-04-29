import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PIPELINE_STAGES, type StageId } from "@marpex/domain";
import { useAuth } from "../components/AuthProvider.tsx";
import { ScopeToggle } from "../components/ScopeToggle.tsx";
import { api } from "../lib/api.ts";
import { withViewScope, type ViewScope } from "../lib/view-scope.ts";

interface Opportunity {
  id: string;
  title: string;
  value: string;
  stage: StageId;
  nextStepSummary: string;
  nextStepDeadline: string;
  stagnant: boolean;
  customerId: string;
  updatedAt?: string;
}

interface Customer {
  id: string;
  name: string;
}

function fmtMoney(value: number) {
  return `€ ${value.toLocaleString("sk-SK", { maximumFractionDigits: 0 })}`;
}

export function PipelineStageDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { stageId } = useParams<{ stageId: StageId }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentScope: ViewScope = searchParams.get("scope") === "all" ? "all" : "mine";
  const requestedScope: ViewScope = user?.role === "sales" ? currentScope : "all";
  const stage = PIPELINE_STAGES.find((item) => item.id === stageId);

  const { data: opportunities = [], isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities", requestedScope],
    queryFn: () => api(withViewScope("/opportunities", requestedScope)),
    enabled: !authLoading,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers", requestedScope],
    queryFn: () => api(withViewScope("/customers", requestedScope)),
    enabled: !authLoading,
  });

  function updateScope(scope: ViewScope) {
    const nextParams = new URLSearchParams(searchParams);

    if (scope === "all") {
      nextParams.set("scope", "all");
    } else {
      nextParams.delete("scope");
    }

    setSearchParams(nextParams, { replace: true });
  }

  if (!stage) {
    return <p className="text-sm text-red-600">Neznáma fáza pipeline.</p>;
  }

  if (authLoading) {
    return <p className="text-sm text-gray-400">Načítavam fázu pipeline…</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400">Načítavam fázu pipeline…</p>;
  }

  const stageOpportunities = opportunities.filter((item) => item.stage === stage.id);
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const totalValue = stageOpportunities.reduce((sum, item) => sum + Number(item.value), 0);
  const stagnantCount = stageOpportunities.filter((item) => item.stagnant).length;

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500">
        <Link to={requestedScope === "all" ? "/pipeline?scope=all" : "/pipeline"} className="hover:underline">Pipeline</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-800">{stage.label}</span>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-600">Fáza pipeline</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{stage.label}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Detailný pohľad na všetky príležitosti v tejto fáze vrátane zákazníka, hodnoty, ďalšieho kroku a stagnácie.
            </p>
            {user?.role === "sales" && (
              <div className="mt-4">
                <ScopeToggle scope={currentScope} onChange={updateScope} mineLabel="Moje príležitosti" allLabel="Všetky príležitosti" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 md:min-w-[22rem]">
            <StageMetric label="Počet" value={String(stageOpportunities.length)} />
            <StageMetric label="Potenciál" value={fmtMoney(totalValue)} accent="text-emerald-700" />
            <StageMetric label="Stagnuje" value={String(stagnantCount)} accent={stagnantCount > 0 ? "text-amber-700" : undefined} />
          </div>
        </div>
      </section>

      {stageOpportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          V tejto fáze aktuálne nie sú žiadne príležitosti.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {stageOpportunities.map((item) => (
              <Link
                key={item.id}
                to={`/pipeline/${item.id}`}
                className={`block rounded-2xl border p-4 shadow-sm ${item.stagnant ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{customerNameById.get(item.customerId) ?? "Neznámy zákazník"}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-700">Detail</span>
                </div>
                <p className="mt-3 text-sm font-medium text-emerald-700">{fmtMoney(Number(item.value))}</p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{item.nextStepSummary}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{item.nextStepDeadline}</span>
                  {item.stagnant && <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">Stagnuje</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[900px] w-full rounded-2xl border border-gray-200 bg-white text-sm shadow-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Príležitosť</th>
                  <th className="px-4 py-3">Zákazník</th>
                  <th className="px-4 py-3 text-right">Hodnota</th>
                  <th className="px-4 py-3">Ďalší krok</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-center">Stagnácia</th>
                </tr>
              </thead>
              <tbody>
                {stageOpportunities.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${item.stagnant ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/pipeline/${item.id}`} className="text-blue-700 hover:underline">{item.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customerNameById.get(item.customerId) ?? "Neznámy zákazník"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtMoney(Number(item.value))}</td>
                    <td className="px-4 py-3 max-w-sm truncate text-gray-600">{item.nextStepSummary}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.nextStepDeadline}</td>
                    <td className="px-4 py-3 text-center">
                      {item.stagnant ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Áno</span>
                      ) : (
                        <span className="text-xs text-gray-300">Nie</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StageMetric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-900 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}