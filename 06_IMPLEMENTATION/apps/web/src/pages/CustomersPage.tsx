import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { customerSegments, customerIndustries } from "@marpex/domain";

interface Customer {
  id: string;
  name: string;
  segment: string;
  industry: string | null;
  ico: string | null;
  city: string | null;
  district: string | null;
  region: string | null;
  currentYearRevenue: string | null;
  previousYearRevenue: string | null;
  annualRevenuePlan: string | null;
  annualRevenuePlanYear: number | null;
}

type SortKey =
  | "name"
  | "industry"
  | "ico"
  | "city"
  | "district"
  | "region"
  | "currentYearRevenue"
  | "previousYearRevenue"
  | "annualRevenuePlan";

type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  industry: string;
  ico: string;
  city: string;
  district: string;
  region: string;
  currentYearRevenue: string;
  previousYearRevenue: string;
  annualRevenuePlan: string;
}

const DEFAULT_SORT_DIRECTIONS: Record<SortKey, SortDirection> = {
  name: "asc",
  industry: "asc",
  ico: "asc",
  city: "asc",
  district: "asc",
  region: "asc",
  currentYearRevenue: "desc",
  previousYearRevenue: "desc",
  annualRevenuePlan: "desc",
};

const EMPTY_FILTERS: ColumnFilters = {
  name: "",
  industry: "",
  ico: "",
  city: "",
  district: "",
  region: "",
  currentYearRevenue: "",
  previousYearRevenue: "",
  annualRevenuePlan: "",
};

const INDUSTRY_LABELS: Record<string, string> = {
  potravinarstvo: "Potravinarstvo",
  oem: "OEM",
  mobile_equipment: "Mobile Equipment",
};

function formatCurrency(value: string | null) {
  return value ? `€ ${Number(value).toLocaleString("sk-SK")}` : "–";
}

function formatIndustry(value: string | null) {
  return value ? INDUSTRY_LABELS[value] ?? value : "–";
}

function resolveCurrentYearPlan(customer: Customer, currentYear: number) {
  return customer.annualRevenuePlanYear === currentYear ? customer.annualRevenuePlan : null;
}

function containsText(value: string | null | undefined, filter: string) {
  const normalizedFilter = filter.trim().toLocaleLowerCase("sk-SK");
  if (!normalizedFilter) {
    return true;
  }

  return (value ?? "").toLocaleLowerCase("sk-SK").includes(normalizedFilter);
}

function containsCurrency(value: string | null, filter: string) {
  const normalizedFilter = filter.trim().toLocaleLowerCase("sk-SK");
  if (!normalizedFilter) {
    return true;
  }

  if (!value) {
    return false;
  }

  const localizedNumber = Number(value).toLocaleString("sk-SK").toLocaleLowerCase("sk-SK");
  return value.toLocaleLowerCase("sk-SK").includes(normalizedFilter)
    || localizedNumber.includes(normalizedFilter)
    || formatCurrency(value).toLocaleLowerCase("sk-SK").includes(normalizedFilter);
}

function parseSortableNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSortableValue(customer: Customer, key: SortKey, currentYear: number) {
  switch (key) {
    case "name":
      return customer.name.toLocaleLowerCase("sk-SK");
    case "industry":
      return formatIndustry(customer.industry).toLocaleLowerCase("sk-SK");
    case "ico":
      return customer.ico?.toLocaleLowerCase("sk-SK") ?? null;
    case "city":
      return customer.city?.toLocaleLowerCase("sk-SK") ?? null;
    case "district":
      return customer.district?.toLocaleLowerCase("sk-SK") ?? null;
    case "region":
      return customer.region?.toLocaleLowerCase("sk-SK") ?? null;
    case "currentYearRevenue":
      return parseSortableNumber(customer.currentYearRevenue);
    case "previousYearRevenue":
      return parseSortableNumber(customer.previousYearRevenue);
    case "annualRevenuePlan":
      return parseSortableNumber(resolveCurrentYearPlan(customer, currentYear));
    default:
      return null;
  }
}

function compareCustomers(
  left: Customer,
  right: Customer,
  sortKey: SortKey,
  sortDirection: SortDirection,
  currentYear: number,
) {
  const leftValue = getSortableValue(left, sortKey, currentYear);
  const rightValue = getSortableValue(right, sortKey, currentYear);

  if (leftValue === null && rightValue === null) {
    return 0;
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  const result = typeof leftValue === "number" && typeof rightValue === "number"
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue), "sk");

  return sortDirection === "asc" ? result : result * -1;
}

function sortIndicator(activeKey: SortKey, sortKey: SortKey, sortDirection: SortDirection) {
  if (activeKey !== sortKey) {
    return "↕";
  }

  return sortDirection === "asc" ? "↑" : "↓";
}

export function CustomersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const [sortState, setSortState] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "name",
    direction: DEFAULT_SORT_DIRECTIONS.name,
  });

  // Create form state
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<string>(customerSegments[0]);
  const [industry, setIndustry] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api("/customers"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          segment,
          industry: industry || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
      setName("");
      setIndustry("");
    },
  });

  const hasActiveFilters = Object.values(columnFilters).some((value) => value.trim().length > 0);

  const visibleCustomers = [...customers]
    .filter((customer) => {
      const currentYearPlan = resolveCurrentYearPlan(customer, currentYear);

      return containsText(customer.name, columnFilters.name)
        && (!columnFilters.industry || customer.industry === columnFilters.industry)
        && containsText(customer.ico, columnFilters.ico)
        && containsText(customer.city, columnFilters.city)
        && containsText(customer.district, columnFilters.district)
        && containsText(customer.region, columnFilters.region)
        && containsCurrency(customer.currentYearRevenue, columnFilters.currentYearRevenue)
        && containsCurrency(customer.previousYearRevenue, columnFilters.previousYearRevenue)
        && containsCurrency(currentYearPlan, columnFilters.annualRevenuePlan);
    })
    .sort((left, right) => compareCustomers(left, right, sortState.key, sortState.direction, currentYear));

  function updateColumnFilter(key: keyof ColumnFilters, value: string) {
    setColumnFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleSort(key: SortKey) {
    setSortState((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: DEFAULT_SORT_DIRECTIONS[key],
      };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold">Zákazníci</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Zavrieť" : "+ Nový zákazník"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-3"
        >
          <input
            placeholder="Názov firmy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm col-span-3"
          />
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
            {customerSegments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="">Odvetvie</option>
            {customerIndustries.map((value) => <option key={value} value={value}>{formatIndustry(value)}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700">
            Uložiť
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Načítavam…</p>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Žiadni zákazníci. Pridajte prvého.</p>
        </div>
      ) : visibleCustomers.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">Žiadne výsledky pre zadané stĺpcové filtre.</p>
          <button
            type="button"
            onClick={() => setColumnFilters(EMPTY_FILTERS)}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Vyčistiť filtre
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Prehľad zákazníkov</p>
              <p className="text-sm text-slate-600">
                Zobrazené {visibleCustomers.length} z {customers.length} zákazníkov
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setColumnFilters(EMPTY_FILTERS)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Vyčistiť filtre
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[1380px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-white text-left text-slate-500">
                  <th className="sticky left-0 top-0 z-40 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Názov</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "name", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("industry")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Odvetvie</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "industry", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("ico")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>IČO</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "ico", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("city")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Mesto</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "city", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("district")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Okres</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "district", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("region")}
                      className="flex w-full items-center justify-between gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Kraj</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "region", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("currentYearRevenue")}
                      className="flex w-full items-center justify-end gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Tržby Finstat 24/25</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "currentYearRevenue", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("previousYearRevenue")}
                      className="flex w-full items-center justify-end gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Tržby {currentYear - 1}</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "previousYearRevenue", sortState.direction)}</span>
                    </button>
                  </th>
                  <th className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white px-4 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSort("annualRevenuePlan")}
                      className="flex w-full items-center justify-end gap-2 font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      <span>Plán</span>
                      <span className="text-xs text-slate-400">{sortIndicator(sortState.key, "annualRevenuePlan", sortState.direction)}</span>
                    </button>
                  </th>
                </tr>

                <tr className="bg-slate-50/80 text-left text-slate-500">
                  <th className="sticky left-0 top-14 z-40 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať názov"
                      value={columnFilters.name}
                      onChange={(event) => updateColumnFilter("name", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <select
                      value={columnFilters.industry}
                      onChange={(event) => updateColumnFilter("industry", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400"
                    >
                      <option value="">Všetky</option>
                      {customerIndustries.map((value) => (
                        <option key={value} value={value}>{formatIndustry(value)}</option>
                      ))}
                    </select>
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať IČO"
                      value={columnFilters.ico}
                      onChange={(event) => updateColumnFilter("ico", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať mesto"
                      value={columnFilters.city}
                      onChange={(event) => updateColumnFilter("city", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať okres"
                      value={columnFilters.district}
                      onChange={(event) => updateColumnFilter("district", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať kraj"
                      value={columnFilters.region}
                      onChange={(event) => updateColumnFilter("region", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať tržby"
                      value={columnFilters.currentYearRevenue}
                      onChange={(event) => updateColumnFilter("currentYearRevenue", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať tržby"
                      value={columnFilters.previousYearRevenue}
                      onChange={(event) => updateColumnFilter("previousYearRevenue", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                  <th className="sticky top-14 z-30 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 pt-1 backdrop-blur">
                    <input
                      type="search"
                      placeholder="Filtrovať plán"
                      value={columnFilters.annualRevenuePlan}
                      onChange={(event) => updateColumnFilter("annualRevenuePlan", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50/80">
                    <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 font-medium">
                      <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:underline">{customer.name}</Link>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{formatIndustry(customer.industry)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{customer.ico || "–"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{customer.city || "–"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{customer.district || "–"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{customer.region || "–"}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(customer.currentYearRevenue)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-700">{formatCurrency(customer.previousYearRevenue)}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-700">{formatCurrency(resolveCurrentYearPlan(customer, currentYear))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

