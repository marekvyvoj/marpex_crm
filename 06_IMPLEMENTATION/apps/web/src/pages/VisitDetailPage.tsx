import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider.tsx";
import { api } from "../lib/api.ts";

interface Visit {
  id: string;
  date: string;
  customerId: string;
  contactId: string;
  visitGoal: string;
  result: string;
  customerNeed: string;
  notes: string | null;
  opportunityCreated: boolean;
  opportunityType?: "project" | "service" | "cross_sell" | null;
  potentialEur: string;
  competition: string;
  nextStep: string;
  nextStepDeadline: string;
  lateFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  segment: string;
  ownerId?: string | null;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string | null;
  phone: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completedAt: string | null;
  ownerId: string;
  ownerName: string | null;
}

interface UserOption {
  id: string;
  name: string;
  role: "manager" | "sales";
  active: boolean;
}

function fmtMoney(value: string) {
  return `€ ${Number(value).toLocaleString("sk-SK", { maximumFractionDigits: 0 })}`;
}

function visitTypeLabel(type: "project" | "service" | "cross_sell") {
  if (type === "project") return "Projekt";
  if (type === "service") return "Servis";
  return "Cross-sell";
}

export function VisitDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "", ownerId: "" });

  const { data: visit, isLoading } = useQuery<Visit>({
    queryKey: ["visit", id],
    queryFn: () => api(`/visits/${id}`),
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ["customer", visit?.customerId],
    queryFn: () => api(`/customers/${visit!.customerId}`),
    enabled: !!visit?.customerId,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts", visit?.customerId],
    queryFn: () => api(`/customers/${visit!.customerId}/contacts`),
    enabled: !!visit?.customerId,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["visit-tasks", visit?.customerId],
    queryFn: () => api(`/tasks?customerId=${visit!.customerId}`),
    enabled: !!visit?.customerId,
  });

  const { data: salesUsers = [] } = useQuery<UserOption[]>({
    queryKey: ["users", "sales-options"],
    queryFn: () => api("/users/sales-options"),
    enabled: showTaskForm,
  });

  const activeSalesUsers = salesUsers;
  const defaultTaskOwnerId = user?.role === "sales"
    ? user.id
    : customer?.ownerId ?? activeSalesUsers[0]?.id ?? "";

  const createTask = useMutation({
    mutationFn: (body: object) => api("/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["visit-tasks", visit?.customerId] });
      setShowTaskForm(false);
      setTaskForm({ title: "", dueDate: "", ownerId: defaultTaskOwnerId });
    },
  });

  const completeTask = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      api(`/tasks/${taskId}/complete`, { method: "PATCH", body: JSON.stringify({ completed }) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["visit-tasks", visit?.customerId] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api(`/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["visit-tasks", visit?.customerId] });
    },
  });

  const contact = visit ? contacts.find((item) => item.id === visit.contactId) : undefined;

  function toggleTaskFormPanel() {
    if (!showTaskForm && !taskForm.ownerId && defaultTaskOwnerId) {
      setTaskForm((current) => ({ ...current, ownerId: defaultTaskOwnerId }));
    }

    setShowTaskForm((current) => !current);
  }

  if (isLoading || !visit) {
    return <p className="text-gray-400 text-sm">Načítavam detail návštevy…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500">
        <Link to="/visits" className="hover:underline">Návštevy</Link>
        {customer && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{visit.date}</span>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Návšteva z {visit.date}</h2>
              {visit.lateFlag && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Zadané oneskorene
                </span>
              )}
              {visit.opportunityCreated && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Vznikla príležitosť
                </span>
              )}
            </div>
            {customer && (
              <p className="text-sm text-gray-500">
                Zákazník: <Link to={`/customers/${customer.id}`} className="font-medium text-blue-700 hover:underline">{customer.name}</Link>
                <span className="ml-2 text-xs uppercase tracking-wide text-gray-400">{customer.segment}</span>
              </p>
            )}
            {contact && (
              <p className="mt-1 text-sm text-gray-500">
                Kontakt: <span className="font-medium text-gray-700">{contact.firstName} {contact.lastName}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:min-w-[18rem]">
            <Metric label="Potenciál" value={fmtMoney(visit.potentialEur)} accent="text-emerald-700" />
            <Metric label="Typ" value={visit.opportunityType ? visitTypeLabel(visit.opportunityType) : "Bez príležitosti"} />
            <Metric label="Next step" value={visit.nextStepDeadline} />
            <Metric label="Aktualizované" value={new Date(visit.updatedAt).toLocaleDateString("sk-SK")} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <section className="space-y-5">
          <InfoCard title="Cieľ návštevy" value={visit.visitGoal} />
          <InfoCard title="Výsledok" value={visit.result} />
          <InfoCard title="Potreba zákazníka" value={visit.customerNeed} />
          <InfoCard title="Poznámky z návštevy" value={visit.notes || "Bez doplnenej poznámky."} muted={!visit.notes} />
        </section>

        <section className="space-y-5">
          <InfoCard title="Konkurencia" value={visit.competition} compact />
          <InfoCard title="Ďalší krok" value={`${visit.nextStep}\nTermín: ${visit.nextStepDeadline}`} compact />
          {contact && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Kontakt</h3>
              <p className="mt-3 text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400">{contact.role}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>{contact.email || "Bez e-mailu"}</p>
                <p>{contact.phone || "Bez telefónu"}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Úlohy zo stretnutia</h3>
            <p className="mt-1 text-xs text-gray-500">Nová úloha sa uloží k zákazníkovi a priradený obchodník sa stane jeho riešiteľom.</p>
          </div>
          <button type="button" onClick={toggleTaskFormPanel} className="text-xs text-blue-600 hover:underline">
            {showTaskForm ? "Zavrieť" : "+ Nová úloha"}
          </button>
        </div>

        {showTaskForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createTask.mutate({
                ...taskForm,
                customerId: visit.customerId,
                ownerId: taskForm.ownerId || defaultTaskOwnerId || undefined,
              });
            }}
            className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3"
          >
            <input
              required
              placeholder="Popis úlohy"
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-3"
            />
            <input
              required
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              aria-label="Termín úlohy zo stretnutia"
            />
            <select
              required
              value={taskForm.ownerId || defaultTaskOwnerId}
              onChange={(event) => setTaskForm((current) => ({ ...current, ownerId: event.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              aria-label="Riešiteľ úlohy zo stretnutia"
            >
              <option value="">Vybrať riešiteľa</option>
              {activeSalesUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select>
            <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              Uložiť úlohu
            </button>
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400">Zatiaľ nie sú evidované žiadne úlohy pre tohto zákazníka.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${task.completedAt ? "border-slate-200 bg-slate-50 opacity-60" : new Date(task.dueDate) < new Date() ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
                <input
                  type="checkbox"
                  checked={!!task.completedAt}
                  onChange={(event) => completeTask.mutate({ taskId: task.id, completed: event.target.checked })}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium text-gray-900 ${task.completedAt ? "line-through" : ""}`}>{task.title}</p>
                  {task.description && <p className="mt-1 text-xs text-gray-500">{task.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">{task.dueDate}{task.ownerName ? ` • ${task.ownerName}` : ""}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Zmazať úlohu ${task.title}`}
                  onClick={() => deleteTask.mutate(task.id)}
                  className="text-xs text-gray-300 hover:text-red-500"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-800 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function InfoCard({ title, value, muted = false, compact = false }: { title: string; value: string; muted?: boolean; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <p className={`mt-3 whitespace-pre-line text-sm leading-6 ${compact ? "min-h-0" : "min-h-28"} ${muted ? "text-gray-400" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}