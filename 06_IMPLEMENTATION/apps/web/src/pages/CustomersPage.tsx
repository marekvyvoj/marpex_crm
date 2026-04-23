import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { customerSegments, strategicCategories } from "@marpex/domain";

interface Customer {
  id: string;
  name: string;
  segment: string;
  currentRevenue: string | null;
  potential: string | null;
  strategicCategory: string | null;
}

export function CustomersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<string>(customerSegments[0]);
  const [category, setCategory] = useState<string>("");

  // Build query string from active filters
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  if (filterSegment) params.set("segment", filterSegment);
  if (filterCategory) params.set("category", filterCategory);
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
          strategicCategory: category || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
      setName("");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Zákazníci</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Zavrieť" : "+ Nový zákazník"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Hľadať podľa názvu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Všetky kategórie</option>
          {strategicCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || filterSegment || filterCategory) && (
          <button
            onClick={() => { setSearch(""); setFilterSegment(""); setFilterCategory(""); }}
            className="text-sm text-gray-400 hover:text-gray-700 px-2"
          >
            ✕ Zrušiť
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-3 gap-3"
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
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="">Kategória</option>
            {strategicCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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
          <p className="text-sm">{(search || filterSegment || filterCategory) ? "Žiadne výsledky pre zadané filtre." : "Žiadni zákazníci. Pridajte prvého."}</p>
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg border border-gray-200 text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-2">Názov</th>
              <th className="px-4 py-2">Segment</th>
              <th className="px-4 py-2">Kategória</th>
              <th className="px-4 py-2 text-right">Revenue</th>
              <th className="px-4 py-2 text-right">Potenciál</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/customers/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-2">{c.segment}</td>
                <td className="px-4 py-2">{c.strategicCategory || "–"}</td>
                <td className="px-4 py-2 text-right">{c.currentRevenue ? `€ ${Number(c.currentRevenue).toLocaleString("sk-SK")}` : "–"}</td>
                <td className="px-4 py-2 text-right">{c.potential ? `€ ${Number(c.potential).toLocaleString("sk-SK")}` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

