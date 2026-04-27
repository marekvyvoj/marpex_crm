import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { customerSegments, customerIndustries, strategicCategories, contactRoles } from "@marpex/domain";

interface Customer {
  id: string;
  name: string;
  segment: string;
  industry: string | null;
  ico: string | null;
  dic: string | null;
  icDph: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  district: string | null;
  region: string | null;
  currentRevenue: string | null;
  profit: string | null;
  annualRevenuePlan: string | null;
  annualRevenuePlanYear: number | null;
  potential: string | null;
  shareOfWallet: number | null;
  strategicCategory: string | null;
  createdAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  position: string | null;
  email: string | null;
  phone: string | null;
}

interface Visit {
  id: string;
  date: string;
  visitGoal: string;
  result: string;
  customerNeed: string;
  notes: string | null;
  nextStep: string;
  nextStepDeadline: string;
  opportunityCreated: boolean;
  opportunityType?: "project" | "service" | "cross_sell" | null;
  potentialEur: string;
  lateFlag: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  stage: string;
  value: string;
  nextStepSummary: string;
  nextStepDeadline: string;
  stagnant: boolean;
}

interface AbraRevenue {
  id: string;
  year: number;
  totalAmount: string;
  invoiceCount: number;
}

interface AbraQuote {
  id: string;
  documentNumber: string;
  documentDate: string;
  totalAmountExVat: string;
  status: string | null;
  description: string | null;
  responsiblePerson: string | null;
  sentAt: string | null;
}

interface AbraOrder {
  id: string;
  documentNumber: string;
  documentDate: string;
  totalAmountExVat: string;
  status: string | null;
  description: string | null;
  responsiblePerson: string | null;
}

type Tab = "contacts" | "visits" | "opportunities" | "abra_revenues" | "abra_quotes" | "abra_orders";

const STAGE_LABELS: Record<string, string> = {
  identified_need: "Identifikovaná potreba",
  qualified: "Kvalifikovaný",
  technical_solution: "Technické riešenie",
  quote_delivered: "Ponuka odoslaná",
  negotiation: "Rokovanie",
  verbal_confirmed: "Verbálne potvrdený",
  won: "Vyhratý",
  lost: "Stratený",
};

const INDUSTRY_LABELS: Record<string, string> = {
  potravinarstvo: "Potravinarstvo",
  oem: "OEM",
  mobile_equipment: "Mobile Equipment",
};

function fmt(n: string | null) {
  if (!n) return "–";
  return `€ ${Number(n).toLocaleString("sk-SK")}`;
}

function formatIndustry(value: string | null) {
  return value ? INDUSTRY_LABELS[value] ?? value : "–";
}

function getYearProgress(date: Date) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 0);
  const current = new Date(year, date.getMonth(), date.getDate());
  const diff = current.getTime() - start.getTime();
  const daysElapsed = Math.floor(diff / 86_400_000);
  const isLeapYear = new Date(year, 1, 29).getMonth() === 1;
  return Number(((daysElapsed / (isLeapYear ? 366 : 365)) * 100).toFixed(1));
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("contacts");
  const [editMode, setEditMode] = useState(false);
  const currentYear = new Date().getFullYear();

  // Customer
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["customer", id],
    queryFn: () => api(`/customers/${id}`),
  });

  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const updateCustomer = useMutation({
    mutationFn: (body: object) =>
      api(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", id] });
      setEditMode(false);
    },
  });

  // Contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["customer-contacts", id],
    queryFn: () => api(`/customers/${id}/contacts`),
  });

  // Visits
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ["customer-visits", id],
    queryFn: () => api(`/customers/${id}/visits`),
  });

  // Opportunities
  const { data: opps = [] } = useQuery<Opportunity[]>({
    queryKey: ["customer-opps", id],
    queryFn: () => api(`/customers/${id}/opportunities`),
  });

  // ABRA data
  const { data: abraRevenues = [] } = useQuery<AbraRevenue[]>({
    queryKey: ["customer-abra-revenues", id],
    queryFn: () => api(`/customers/${id}/abra-revenues`),
  });
  const { data: abraQuotes = [] } = useQuery<AbraQuote[]>({
    queryKey: ["customer-abra-quotes", id],
    queryFn: () => api(`/customers/${id}/abra-quotes`),
  });
  const { data: abraOrders = [] } = useQuery<AbraOrder[]>({
    queryKey: ["customer-abra-orders", id],
    queryFn: () => api(`/customers/${id}/abra-orders`),
  });

  // New contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    role: contactRoles[0] as string,
    position: "",
    email: "",
    phone: "",
  });
  const createContact = useMutation({
    mutationFn: () =>
      api(`/customers/${id}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          ...contactForm,
          position: contactForm.position || undefined,
          email: contactForm.email || undefined,
          phone: contactForm.phone || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-contacts", id] });
      setShowContactForm(false);
      setContactForm({ firstName: "", lastName: "", role: contactRoles[0], position: "", email: "", phone: "" });
    },
  });

  if (isLoading || !customer) {
    return <p className="text-gray-400 text-sm">Načítavam…</p>;
  }

  const revenueByYear = new Map(abraRevenues.map((item) => [item.year, item]));
  const revenueYears = [currentYear, currentYear - 1, currentYear - 2];
  const currentYearRevenue = Number(revenueByYear.get(currentYear)?.totalAmount ?? 0);
  const currentYearPlan = customer.annualRevenuePlanYear === currentYear && customer.annualRevenuePlan
    ? Number(customer.annualRevenuePlan)
    : null;
  const planProgress = currentYearPlan && currentYearPlan > 0
    ? Number(((currentYearRevenue / currentYearPlan) * 100).toFixed(1))
    : null;
  const elapsedYearProgress = getYearProgress(new Date());
  const planDelta = planProgress !== null ? Number((planProgress - elapsedYearProgress).toFixed(1)) : null;
  let planStatus: { label: string; tone: "green" | "amber" | "red" } | null = null;
  if (planProgress !== null && planDelta !== null) {
    if (planDelta >= 0) {
      planStatus = { label: "Plán sa plní", tone: "green" };
    } else if (planDelta >= -5) {
      planStatus = { label: "Tesne za plánom", tone: "amber" };
    } else {
      planStatus = { label: "Za plánom", tone: "red" };
    }
  }

  function startEdit() {
    setEditForm({
      name: customer!.name,
      segment: customer!.segment,
      industry: customer!.industry ?? undefined,
      ico: customer!.ico ?? undefined,
      dic: customer!.dic ?? undefined,
      icDph: customer!.icDph ?? undefined,
      address: customer!.address ?? undefined,
      city: customer!.city ?? undefined,
      postalCode: customer!.postalCode ?? undefined,
      district: customer!.district ?? undefined,
      region: customer!.region ?? undefined,
      currentRevenue: customer!.currentRevenue ?? undefined,
      profit: customer!.profit ?? undefined,
      annualRevenuePlan: customer!.annualRevenuePlan ?? undefined,
      annualRevenuePlanYear: customer!.annualRevenuePlanYear ?? undefined,
      potential: customer!.potential ?? undefined,
      strategicCategory: customer!.strategicCategory ?? undefined,
    } as any);
    setEditMode(true);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (editForm.name) body.name = editForm.name;
    if (editForm.segment) body.segment = editForm.segment;
    if ((editForm as any).industry !== undefined) body.industry = (editForm as any).industry || undefined;
    if ((editForm as any).ico !== undefined) body.ico = (editForm as any).ico || undefined;
    if ((editForm as any).dic !== undefined) body.dic = (editForm as any).dic || undefined;
    if ((editForm as any).icDph !== undefined) body.icDph = (editForm as any).icDph || undefined;
    if ((editForm as any).address !== undefined) body.address = (editForm as any).address || undefined;
    if ((editForm as any).city !== undefined) body.city = (editForm as any).city || undefined;
    if ((editForm as any).postalCode !== undefined) body.postalCode = (editForm as any).postalCode || undefined;
    if ((editForm as any).district !== undefined) body.district = (editForm as any).district || undefined;
    if ((editForm as any).region !== undefined) body.region = (editForm as any).region || undefined;
    if ((editForm as any).currentRevenue !== undefined)
      body.currentRevenue = Number((editForm as any).currentRevenue) || undefined;
    if ((editForm as any).profit !== undefined) {
      body.profit = (editForm as any).profit === "" ? null : Number((editForm as any).profit) || 0;
    }
    if ((editForm as any).annualRevenuePlan !== undefined) {
      if ((editForm as any).annualRevenuePlan === "") {
        body.annualRevenuePlan = null;
        body.annualRevenuePlanYear = null;
      } else {
        body.annualRevenuePlan = Number((editForm as any).annualRevenuePlan) || 0;
        body.annualRevenuePlanYear = currentYear;
      }
    }
    if ((editForm as any).potential !== undefined)
      body.potential = Number((editForm as any).potential) || undefined;
    if ((editForm as any).strategicCategory)
      body.strategicCategory = (editForm as any).strategicCategory;
    updateCustomer.mutate(body);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/customers" className="hover:underline">Zákazníci</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{customer.name}</span>
      </div>

      {/* Customer header */}
      {editMode ? (
        <form onSubmit={submitEdit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-4"
            placeholder="Názov firmy"
            value={(editForm as any).name ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).segment ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, segment: e.target.value }))}
          >
            {customerSegments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).industry ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))}
          >
            <option value="">Odvetvie –</option>
            {customerIndustries.map((value) => <option key={value} value={value}>{formatIndustry(value)}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).strategicCategory ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, strategicCategory: e.target.value }))}
          >
            <option value="">Kategória –</option>
            {strategicCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            placeholder="IČO"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).ico ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, ico: e.target.value }))}
          />
          <input
            placeholder="DIČ"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).dic ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, dic: e.target.value }))}
          />
          <input
            placeholder="IČ DPH"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).icDph ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, icDph: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-4"
            placeholder="Adresa"
            value={(editForm as any).address ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
          />
          <input
            placeholder="Mesto"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).city ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            placeholder="PSČ"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).postalCode ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, postalCode: e.target.value }))}
          />
          <input
            placeholder="Okres"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).district ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
          />
          <input
            placeholder="Kraj"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).region ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            placeholder="Current Revenue €"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).currentRevenue ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, currentRevenue: e.target.value } as any))}
          />
          <input
            type="number"
            min={0}
            placeholder="Zisk €"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).profit ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, profit: e.target.value } as any))}
          />
          <input
            type="number"
            min={0}
            placeholder={`Plán tržieb ${currentYear} €`}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).annualRevenuePlan ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, annualRevenuePlan: e.target.value } as any))}
          />
          <input
            type="number"
            min={0}
            placeholder="Potenciál €"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={(editForm as any).potential ?? ""}
            onChange={(e) => setEditForm((f) => ({ ...f, potential: e.target.value } as any))}
          />
          <div className="md:col-span-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setEditMode(false)} className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50">Zrušiť</button>
            <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Uložiť</button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Odvetvie: <strong>{formatIndustry(customer.industry)}</strong></span>
              <span>Segment: <strong>{customer.segment}</strong></span>
              {customer.strategicCategory && <span>Kategória: <strong>{customer.strategicCategory}</strong></span>}
              <span>Potenciál: <strong>{fmt(customer.potential)}</strong></span>
              {customer.profit && <span>Zisk: <strong>{fmt(customer.profit)}</strong></span>}
              {currentYearPlan && <span>Plán {currentYear}: <strong>{fmt(String(currentYearPlan))}</strong></span>}
              {customer.shareOfWallet != null && <span>SoW: <strong>{customer.shareOfWallet} %</strong></span>}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-4">
              <span>IČO: <strong>{customer.ico || "–"}</strong></span>
              <span>DIČ: <strong>{customer.dic || "–"}</strong></span>
              <span>IČ DPH: <strong>{customer.icDph || "–"}</strong></span>
              <span>Mesto: <strong>{customer.city || "–"}</strong></span>
              <span>PSČ: <strong>{customer.postalCode || "–"}</strong></span>
              <span>Okres: <strong>{customer.district || "–"}</strong></span>
              <span>Kraj: <strong>{customer.region || "–"}</strong></span>
              <span className="sm:col-span-2 xl:col-span-4">Adresa: <strong>{customer.address || "–"}</strong></span>
            </div>
          </div>
          <button onClick={startEdit} className="text-sm text-blue-600 hover:underline">Upraviť</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-6 lg:grid-cols-3">
        {revenueYears.map((year) => {
          const revenue = revenueByYear.get(year);
          const isCurrentYear = year === currentYear;
          const revenueText = revenue ? fmt(revenue.totalAmount) : "–";
          const cardClass = isCurrentYear
            ? "border-blue-200 bg-blue-50"
            : "border-gray-200 bg-white";
          const titleClass = isCurrentYear ? "text-blue-700" : "text-gray-500";
          const valueClass = isCurrentYear ? "text-blue-900" : "text-gray-900";

          return (
            <div key={year} className={`rounded-2xl border p-4 shadow-sm ${cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs uppercase tracking-[0.2em] ${titleClass}`}>Tržby {year}</p>
                  <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{revenueText}</p>
                  <p className="mt-1 text-xs text-gray-500">{revenue ? `${revenue.invoiceCount} faktúr` : "Bez dát z ABRA"}</p>
                </div>
                {isCurrentYear && <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">Aktuálny rok</span>}
              </div>

              {isCurrentYear && currentYearPlan && planProgress !== null && planStatus && (
                <div className="mt-4 rounded-xl bg-white/80 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500">Plnenie plánu</span>
                    <span className={`font-semibold ${planStatus.tone === "green" ? "text-green-700" : planStatus.tone === "amber" ? "text-amber-700" : "text-red-700"}`}>
                      {planStatus.label}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${planStatus.tone === "green" ? "bg-green-500" : planStatus.tone === "amber" ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(planProgress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>{planProgress.toFixed(1)} % z plánu {fmt(String(currentYearPlan))}</span>
                    <span>Tempo roka: {elapsedYearProgress.toFixed(1)} %</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{contacts.length}</p>
          <p className="text-xs text-gray-500">Kontakty</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{visits.length}</p>
          <p className="text-xs text-gray-500">Návštevy</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{opps.length}</p>
          <p className="text-xs text-gray-500">Príležitosti</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 flex-wrap gap-y-1">
        {(["contacts", "visits", "opportunities", "abra_revenues", "abra_quotes", "abra_orders"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t === "contacts" ? "Kontakty"
              : t === "visits" ? "Návštevy"
              : t === "opportunities" ? "Príležitosti"
              : t === "abra_revenues" ? "Obrat (Abra)"
              : t === "abra_quotes" ? "Ponuky (Abra)"
              : "Objednávky (Abra)"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "contacts" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showContactForm ? "Zavrieť" : "+ Nový kontakt"}
            </button>
          </div>

          {showContactForm && (
            <form
              onSubmit={(e) => { e.preventDefault(); createContact.mutate(); }}
              className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-3 gap-3"
            >
              <input required placeholder="Meno" value={contactForm.firstName}
                onChange={(e) => setContactForm((f) => ({ ...f, firstName: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <input required placeholder="Priezvisko" value={contactForm.lastName}
                onChange={(e) => setContactForm((f) => ({ ...f, lastName: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <select value={contactForm.role}
                onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm">
                {contactRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input placeholder="Pozícia" value={contactForm.position}
                onChange={(e) => setContactForm((f) => ({ ...f, position: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <input type="email" placeholder="Email" value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <input placeholder="Telefón" value={contactForm.phone}
                onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <div className="col-span-3 flex justify-end">
                <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Uložiť kontakt
                </button>
              </div>
            </form>
          )}

          {contacts.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne kontakty.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] bg-white border border-gray-200 rounded-lg text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-2">Meno</th>
                  <th className="px-4 py-2">Rola</th>
                  <th className="px-4 py-2">Pozícia</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Telefón</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium">{c.firstName} {c.lastName}</td>
                    <td className="px-4 py-2">{c.role}</td>
                    <td className="px-4 py-2 text-gray-500">{c.position || "–"}</td>
                    <td className="px-4 py-2">{c.email ? <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a> : "–"}</td>
                    <td className="px-4 py-2">{c.phone || "–"}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "visits" && (
        <div>
          {visits.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne návštevy.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visits.map((v) => (
                  <Link
                    key={v.id}
                    to={`/visits/${v.id}`}
                    className={`block rounded-2xl border p-4 shadow-sm ${v.lateFlag ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{v.date}</p>
                        <p className="mt-1 text-sm text-gray-700">{v.visitGoal}</p>
                      </div>
                      <span className="text-xs text-blue-700">Detail</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{v.result}</p>
                    {v.notes && <p className="mt-2 line-clamp-3 text-xs text-slate-600">{v.notes}</p>}
                    <p className="mt-3 text-xs text-gray-500">{v.nextStep} · {v.nextStepDeadline}</p>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full bg-white border border-gray-200 rounded-lg text-sm min-w-[760px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="px-4 py-2">Dátum</th>
                      <th className="px-4 py-2">Cieľ</th>
                      <th className="px-4 py-2">Výsledok</th>
                      <th className="px-4 py-2 text-right">Potenciál</th>
                      <th className="px-4 py-2">Príležitosť</th>
                      <th className="px-4 py-2">Ďalší krok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v) => (
                      <tr key={v.id} className={`border-b border-gray-100 ${v.lateFlag ? "bg-red-50" : ""}`}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link to={`/visits/${v.id}`} className="font-medium text-blue-600 hover:underline">{v.date}</Link>
                        </td>
                        <td className="px-4 py-2 max-w-xs truncate">{v.visitGoal}</td>
                        <td className="px-4 py-2 max-w-xs truncate">{v.result}</td>
                        <td className="px-4 py-2 text-right">{fmt(v.potentialEur)}</td>
                        <td className="px-4 py-2">{v.opportunityCreated ? "✓" : "–"}</td>
                        <td className="px-4 py-2 max-w-xs truncate text-gray-500">{v.nextStep} <span className="text-xs text-gray-400">({v.nextStepDeadline})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "opportunities" && (
        <div>
          {opps.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne príležitosti.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] bg-white border border-gray-200 rounded-lg text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-2">Názov</th>
                  <th className="px-4 py-2">Fáza</th>
                  <th className="px-4 py-2 text-right">Hodnota</th>
                  <th className="px-4 py-2">Ďalší krok</th>
                  <th className="px-4 py-2">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id} className={`border-b border-gray-100 ${o.stagnant ? "bg-amber-50" : ""}`}>
                    <td className="px-4 py-2">
                      <Link to={`/pipeline/${o.id}`} className="font-medium text-blue-600 hover:underline">
                        {o.title}
                      </Link>
                      {o.stagnant && <span className="ml-2 text-xs text-amber-600">⚠ stagnuje</span>}
                    </td>
                    <td className="px-4 py-2">{STAGE_LABELS[o.stage] ?? o.stage}</td>
                    <td className="px-4 py-2 text-right">{fmt(o.value)}</td>
                    <td className="px-4 py-2 max-w-xs truncate text-gray-500">{o.nextStepSummary}</td>
                    <td className="px-4 py-2">{o.nextStepDeadline}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "abra_revenues" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Obrat za posledné 3 roky (faktúry z ABRA)</h3>
          {abraRevenues.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne dáta o obrate.</p>
          ) : (
            <>
              {/* Bar chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-end gap-4 h-32">
                  {abraRevenues.map((r) => {
                    const max = Math.max(...abraRevenues.map((x) => Number(x.totalAmount)));
                    const pct = max > 0 ? (Number(r.totalAmount) / max) * 100 : 0;
                    return (
                      <div key={r.year} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-500 mb-1">{fmt(r.totalAmount)}</span>
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        <span className="text-xs font-medium mt-1">{r.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] bg-white border border-gray-200 rounded-lg text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-4 py-2">Rok</th>
                    <th className="px-4 py-2 text-right">Celkový obrat (bez DPH)</th>
                    <th className="px-4 py-2 text-right">Počet faktúr</th>
                  </tr>
                </thead>
                <tbody>
                  {abraRevenues.map((r) => (
                    <tr key={r.year} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-semibold">{r.year}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(r.totalAmount)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{r.invoiceCount}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "abra_quotes" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Posledných 10 ponúk (ABRA – Ponuky vydané)</h3>
          {abraQuotes.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne ponuky.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] bg-white border border-gray-200 rounded-lg text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-2">Číslo dokladu</th>
                  <th className="px-4 py-2">Dátum</th>
                  <th className="px-4 py-2 text-right">Celkom bez DPH</th>
                  <th className="px-4 py-2">Stav</th>
                  <th className="px-4 py-2">Popis</th>
                  <th className="px-4 py-2">Zodpovedný</th>
                  <th className="px-4 py-2">Odoslané</th>
                </tr>
              </thead>
              <tbody>
                {abraQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-blue-700">{q.documentNumber}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{q.documentDate}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(q.totalAmountExVat)}</td>
                    <td className="px-4 py-2 text-gray-600">{q.status || "–"}</td>
                    <td className="px-4 py-2 max-w-xs truncate text-gray-500">{q.description || "–"}</td>
                    <td className="px-4 py-2 text-gray-500">{q.responsiblePerson || "–"}</td>
                    <td className="px-4 py-2 text-gray-500">{q.sentAt || "–"}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "abra_orders" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Posledných 10 objednávok (ABRA – Objednávky prijaté)</h3>
          {abraOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">Žiadne objednávky.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] bg-white border border-gray-200 rounded-lg text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-2">Číslo dokladu</th>
                  <th className="px-4 py-2">Dátum</th>
                  <th className="px-4 py-2 text-right">Celkom bez DPH</th>
                  <th className="px-4 py-2">Stav</th>
                  <th className="px-4 py-2">Popis</th>
                  <th className="px-4 py-2">Zodpovedný</th>
                </tr>
              </thead>
              <tbody>
                {abraOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-green-700">{o.documentNumber}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{o.documentDate}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(o.totalAmountExVat)}</td>
                    <td className="px-4 py-2 text-gray-600">{o.status || "–"}</td>
                    <td className="px-4 py-2 max-w-xs truncate text-gray-500">{o.description || "–"}</td>
                    <td className="px-4 py-2 text-gray-500">{o.responsiblePerson || "–"}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
