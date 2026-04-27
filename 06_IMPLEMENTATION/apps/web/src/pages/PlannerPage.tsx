import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";

interface PlannerData {
  summary: {
    overdueCount: number;
    dueTodayCount: number;
    dueThisWeekCount: number;
    laterCount: number;
    totalCount: number;
  };
  windowStart: string;
  windowEnd: string;
  items: PlannerItem[];
}

interface PlannerItem {
  id: string;
  sourceType: "opportunity" | "visit";
  customerId: string;
  customerName: string;
  title: string;
  nextStep: string;
  dueDate: string;
  status: "overdue" | "today" | "this_week" | "later";
  stage: string | null;
  visitDate: string | null;
  value: number | null;
}

const sectionMeta = {
  overdue: {
    heading: "Po termíne",
    description: "Next stepy, ktoré už potrebujú reakciu.",
    badgeClass: "bg-red-100 text-red-700",
    sectionClass: "border-red-100",
  },
  today: {
    heading: "Dnes",
    description: "Úlohy, ktoré by si mal vybaviť ešte dnes.",
    badgeClass: "bg-blue-100 text-blue-700",
    sectionClass: "border-blue-100",
  },
  this_week: {
    heading: "Nasledujúcich 7 dní",
    description: "Najbližšie termíny, ktoré si treba rozplánovať.",
    badgeClass: "bg-amber-100 text-amber-700",
    sectionClass: "border-amber-100",
  },
  later: {
    heading: "Neskôr",
    description: "Ďalšie termíny mimo najbližšieho týždňa.",
    badgeClass: "bg-gray-100 text-gray-700",
    sectionClass: "border-gray-200",
  },
} satisfies Record<PlannerItem["status"], { heading: string; description: string; badgeClass: string; sectionClass: string }>;

export function PlannerPage() {
  const { data, error, isError, isLoading } = useQuery<PlannerData>({
    queryKey: ["dashboard-planner"],
    queryFn: () => api("/dashboard/planner"),
  });

  if (isLoading) return <p className="text-gray-400 text-sm">Načítavam plán práce…</p>;
  if (isError) return <p className="text-red-600 text-sm">{error instanceof Error ? error.message : "Plán práce sa nepodarilo načítať."}</p>;
  if (!data) return <p className="text-gray-400 text-sm">Plán práce nemá dostupné dáta.</p>;

  const groupedItems = {
    overdue: data.items.filter((item) => item.status === "overdue"),
    today: data.items.filter((item) => item.status === "today"),
    this_week: data.items.filter((item) => item.status === "this_week"),
    later: data.items.filter((item) => item.status === "later"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Plán práce</h2>
          <p className="text-sm text-gray-500">
            Moje nadchádzajúce next stepy z návštev a príležitostí. Hlavné plánovacie okno: {formatDate(data.windowStart)} - {formatDate(data.windowEnd)}.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm font-medium text-blue-700 hover:underline">
          Späť na dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Po termíne" value={String(data.summary.overdueCount)} tone="red" />
        <SummaryCard label="Dnes" value={String(data.summary.dueTodayCount)} tone="blue" />
        <SummaryCard label="Do 7 dní" value={String(data.summary.dueThisWeekCount)} tone="amber" />
        <SummaryCard label="Neskôr" value={String(data.summary.laterCount)} tone="gray" />
        <SummaryCard label="Všetky next stepy" value={String(data.summary.totalCount)} tone="slate" />
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Žiadne naplánované next stepy</h3>
          <p className="mt-2 text-sm text-gray-500">
            Keď pri návšteve alebo príležitosti doplníš ďalší krok a termín, zobrazí sa tu automaticky.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedItems).map(([status, items]) => {
            if (items.length === 0) {
              return null;
            }

            const meta = sectionMeta[status as PlannerItem["status"]];

            return (
              <section key={status} className={`rounded-2xl border bg-white p-4 shadow-sm ${meta.sectionClass}`}>
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{meta.heading}</h3>
                    <p className="text-sm text-gray-500">{meta.description}</p>
                  </div>
                  <span className={`inline-flex self-start rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                    {items.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <Link
                      key={`${item.sourceType}-${item.id}`}
                      to={item.sourceType === "opportunity" ? `/pipeline/${item.id}` : `/visits/${item.id}`}
                      className="block rounded-2xl border border-gray-200 px-4 py-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>
                              {statusLabel[item.status]}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              {item.sourceType === "opportunity" ? "Príležitosť" : "Návšteva"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">{item.customerName}</p>
                          <p className="mt-2 text-sm text-gray-800">{item.nextStep}</p>
                        </div>

                        <div className="grid gap-3 text-sm text-gray-500 sm:grid-cols-3 lg:min-w-[22rem]">
                          <PlannerMetric label="Termín" value={formatDate(item.dueDate)} />
                          <PlannerMetric label={item.sourceType === "opportunity" ? "Fáza" : "Dátum návštevy"} value={item.sourceType === "opportunity" ? (stageLabel(item.stage) ?? "-") : (item.visitDate ? formatDate(item.visitDate) : "-")} />
                          <PlannerMetric label={item.sourceType === "opportunity" ? "Hodnota" : "Potenciál"} value={item.value !== null ? `€ ${fmt(item.value)}` : "-"} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "red" | "blue" | "amber" | "gray" | "slate" }) {
  const toneClass = tone === "red"
    ? "bg-red-50 border-red-100 text-red-700"
    : tone === "blue"
      ? "bg-blue-50 border-blue-100 text-blue-700"
      : tone === "amber"
        ? "bg-amber-50 border-amber-100 text-amber-700"
        : tone === "gray"
          ? "bg-gray-50 border-gray-200 text-gray-700"
          : "bg-slate-100 border-slate-200 text-slate-700";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PlannerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-700">{value}</p>
    </div>
  );
}

const statusLabel = {
  overdue: "Po termíne",
  today: "Dnes",
  this_week: "Do 7 dní",
  later: "Neskôr",
};

const stageLabels: Record<string, string> = {
  identified_need: "Identifikovaná potreba",
  qualified: "Kvalifikovaný",
  technical_solution: "Technické riešenie",
  quote_delivered: "Ponuka odoslaná",
  negotiation: "Rokovanie",
  verbal_confirmed: "Verbálne potvrdený",
  won: "Vyhratý",
  lost: "Stratený",
};

function stageLabel(stage: string | null) {
  if (!stage) return null;
  return stageLabels[stage] ?? stage;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("sk-SK");
}

function fmt(value: number) {
  return value.toLocaleString("sk-SK", { maximumFractionDigits: 0 });
}