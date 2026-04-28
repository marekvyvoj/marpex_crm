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
  region: string | null;
  currentYearRevenue: string | null;
  previousYearRevenue: string | null;
  annualRevenuePlan: string | null;
  annualRevenuePlanYear: number | null;
}

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

export function CustomersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();

  // Filter state
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<string>(customerSegments[0]);
  const [industry, setIndustry] = useState("");

  // Build query string from active filters
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  if (filterSegment) params.set("segment", filterSegment);
  if (filterIndustry) params.set("industry", filterIndustry);
  const qs = params.toString();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", qs],
    queryFn: () => api(`/customers${qs ? `?${qs}` : ""}`),
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

      {/* Filter bar */}
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          type="search"
          placeholder="Hľadať podľa názvu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 md:max-w-xs"
        />
        <select
          value={filterSegment}
          onChange={(e) => setFilterSegment(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Všetky segmenty</option>
          {customerSegments.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Všetky odvetvia</option>
          {customerIndustries.map((value) => <option key={value} value={value}>{formatIndustry(value)}</option>)}
        </select>
        {(search || filterSegment || filterIndustry) && (
          <button
            onClick={() => { setSearch(""); setFilterSegment(""); setFilterIndustry(""); }}
            className="text-sm text-gray-400 hover:text-gray-700 px-2"
          >
            ✕ Zrušiť
          </button>
        )}
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
          <p className="text-sm">{(search || filterSegment || filterIndustry) ? "Žiadne výsledky pre zadané filtre." : "Žiadni zákazníci. Pridajte prvého."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] bg-white rounded-lg border border-gray-200 text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-2">Názov</th>
                <th className="px-4 py-2">Odvetvie</th>
                <th className="px-4 py-2">Segment</th>
                <th className="px-4 py-2">IČO</th>
                <th className="px-4 py-2">Mesto</th>
                <th className="px-4 py-2">Kraj</th>
                <th className="px-4 py-2 text-right">Tržby {currentYear}</th>
                <th className="px-4 py-2 text-right">Tržby {currentYear - 1}</th>
                <th className="px-4 py-2 text-right">Plán</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link to={`/customers/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-2">{formatIndustry(c.industry)}</td>
                  <td className="px-4 py-2">{c.segment}</td>
                  <td className="px-4 py-2">{c.ico || "–"}</td>
                  <td className="px-4 py-2">{c.city || "–"}</td>
                  <td className="px-4 py-2">{c.region || "–"}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(c.currentYearRevenue)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(c.previousYearRevenue)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(resolveCurrentYearPlan(c, currentYear))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

