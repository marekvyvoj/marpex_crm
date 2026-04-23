import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitOpportunityTypes, visitSchema, type VisitInput } from "@marpex/domain";
import { api } from "../lib/api.ts";
import { FilterableSelect } from "../components/FilterableSelect.tsx";

interface Visit {
  id: string;
  date: string;
  customerId: string;
  visitGoal: string;
  result: string;
  opportunityType?: "project" | "service" | "cross_sell" | null;
  potentialEur: string;
  nextStep: string;
  nextStepDeadline: string;
  lateFlag: boolean;
}

interface Customer { id: string; name: string; }
interface Contact { id: string; firstName: string; lastName: string; customerId: string; }

export function VisitsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Filter state
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterLate, setFilterLate] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filterCustomerId) params.set("customerId", filterCustomerId);
  if (filterFrom) params.set("from", filterFrom);
  if (filterTo) params.set("to", filterTo);
  if (filterLate) params.set("late", "true");
  const qs = params.toString();

  const { data: visits = [], isLoading } = useQuery<Visit[]>({
    queryKey: ["visits", qs],
    queryFn: () => api(`/visits${qs ? `?${qs}` : ""}`),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api("/customers"),
  });

  const customerOptions = customers.map((customer) => ({ value: customer.id, label: customer.name }));

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts", selectedCustomerId],
    queryFn: () => api(`/customers/${selectedCustomerId}/contacts`),
    enabled: !!selectedCustomerId,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VisitInput>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      opportunityCreated: false,
      potentialEur: 0,
    },
  });

  const create = useMutation({
    mutationFn: (data: VisitInput) =>
      api("/visits", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      setShowForm(false);
      setSelectedCustomerId("");
      reset();
    },
  });

  function onCustomerChange(customerId: string) {
    setSelectedCustomerId(customerId);
    setValue("customerId", customerId, { shouldDirty: true, shouldValidate: true });
    setValue("contactId", "", { shouldDirty: true });
  }

  const opportunityCreated = watch("opportunityCreated");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Návštevy</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Zavrieť" : "+ Nová návšteva"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <FilterableSelect
          className="w-full sm:w-72"
          options={customerOptions}
          value={filterCustomerId}
          onChange={setFilterCustomerId}
          emptyOptionLabel="Všetci zákazníci"
          searchLabel="Filtrovať zákazníkov vo filtroch návštev"
          searchPlaceholder="Filtrovať zákazníkov..."
          selectAriaLabel="Filter zákazníka v návštevách"
          searchClassName="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          selectClassName="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          title="Od dátumu"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          title="Do dátumu"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={filterLate} onChange={(e) => setFilterLate(e.target.checked)} />
          Len oneskorené
        </label>
        {(filterCustomerId || filterFrom || filterTo || filterLate) && (
          <button
            onClick={() => { setFilterCustomerId(""); setFilterFrom(""); setFilterTo(""); setFilterLate(false); }}
            className="text-sm text-gray-400 hover:text-gray-700 px-2"
          >
            ✕ Zrušiť filtre
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((d) => create.mutate(d))}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3"
        >
          <p className="text-sm font-medium text-gray-700 mb-2">11 povinných polí + typ pri vzniknutej príležitosti</p>
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Date */}
            <Field label="Dátum" error={errors.date?.message}>
              <input type="date" {...register("date")} className="input" />
            </Field>

            {/* 2. Customer */}
            <Field label="Zákazník" error={errors.customerId?.message}>
              <input type="hidden" {...register("customerId")} />
              <FilterableSelect
                options={customerOptions}
                value={selectedCustomerId}
                onChange={onCustomerChange}
                emptyOptionLabel="Vybrať…"
                searchLabel="Filtrovať zákazníkov vo formulári návštevy"
                searchPlaceholder="Hľadať zákazníka pre návštevu..."
                selectAriaLabel="Zákazník pre návštevu"
              />
            </Field>

            {/* 3. Contact */}
            <Field label="Kontakt" error={errors.contactId?.message}>
              <select {...register("contactId")} className="input">
                <option value="">Vybrať…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </Field>

            {/* 4. Visit goal */}
            <Field label="Cieľ návštevy" error={errors.visitGoal?.message}>
              <input {...register("visitGoal")} className="input" placeholder="Čo chcete dosiahnuť" />
            </Field>

            {/* 5. Result */}
            <Field label="Výsledok" error={errors.result?.message}>
              <input {...register("result")} className="input" placeholder="Čo sa podarilo" />
            </Field>

            {/* 6. Customer need */}
            <Field label="Potreba zákazníka" error={errors.customerNeed?.message}>
              <input {...register("customerNeed")} className="input" placeholder="Aká je potreba" />
            </Field>

            {/* 7. Opportunity created */}
            <Field label="Vznikla príležitosť?" error={errors.opportunityCreated?.message}>
              <select
                {...register("opportunityCreated", { setValueAs: (v) => v === "true" })}
                className="input"
              >
                <option value="false">Nie</option>
                <option value="true">Áno</option>
              </select>
            </Field>

            {/* 8. Potential EUR */}
            <Field label="Potenciál €" error={errors.potentialEur?.message}>
              <input
                type="number"
                step="0.01"
                {...register("potentialEur", { valueAsNumber: true })}
                className="input"
              />
            </Field>

            <Field label="Typ príležitosti" error={errors.opportunityType?.message} required={opportunityCreated}>
              <select
                {...register("opportunityType")}
                className="input"
                disabled={!opportunityCreated}
              >
                <option value="">{opportunityCreated ? "Vybrať…" : "Najprv označte vznik príležitosti"}</option>
                {visitOpportunityTypes.map((type) => (
                  <option key={type} value={type}>{visitTypeLabel(type)}</option>
                ))}
              </select>
            </Field>

            {/* 9. Competition */}
            <Field label="Konkurencia" error={errors.competition?.message}>
              <input {...register("competition")} className="input" placeholder="Kto tam je" />
            </Field>

            {/* 10. Next step */}
            <Field label="Next step" error={errors.nextStep?.message}>
              <input {...register("nextStep")} className="input" placeholder="Čo ďalej" />
            </Field>

            {/* 11. Next step deadline */}
            <Field label="Termín next stepu" error={errors.nextStepDeadline?.message}>
              <input type="date" {...register("nextStepDeadline")} className="input" />
            </Field>
          </div>

          <button type="submit" className="bg-blue-600 text-white text-sm px-6 py-2 rounded hover:bg-blue-700 mt-2">
            Uložiť návštevu
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Načítavam…</p>
      ) : visits.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">{(filterCustomerId || filterFrom || filterTo || filterLate) ? "Žiadne výsledky pre zadané filtre." : "Žiadne návštevy. Pridajte prvú."}</p>
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg border border-gray-200 text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-2">Dátum</th>
              <th className="px-4 py-2">Cieľ</th>
              <th className="px-4 py-2">Výsledok</th>
              <th className="px-4 py-2">Typ</th>
              <th className="px-4 py-2 text-right">Potenciál €</th>
              <th className="px-4 py-2">Next step</th>
              <th className="px-4 py-2">Deadline</th>
              <th className="px-4 py-2">Late</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{v.date}</td>
                <td className="px-4 py-2">{v.visitGoal}</td>
                <td className="px-4 py-2">{v.result}</td>
                <td className="px-4 py-2">{v.opportunityType ? visitTypeLabel(v.opportunityType) : "-"}</td>
                <td className="px-4 py-2 text-right">€ {v.potentialEur}</td>
                <td className="px-4 py-2">{v.nextStep}</td>
                <td className="px-4 py-2">{v.nextStepDeadline}</td>
                <td className="px-4 py-2">{v.lateFlag ? "⚠️" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Field({ label, error, children, required = true }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}{required ? " *" : ""}</span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

function visitTypeLabel(type: "project" | "service" | "cross_sell") {
  if (type === "project") return "Projekt";
  if (type === "service") return "Servis";
  return "Cross-sell";
}
