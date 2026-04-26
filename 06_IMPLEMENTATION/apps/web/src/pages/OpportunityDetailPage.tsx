import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PIPELINE_STAGES, isValidTransition, type StageId } from "@marpex/domain";
import { api } from "../lib/api.ts";

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  stage: StageId;
  value: string;
  nextStepSummary: string;
  nextStepDeadline: string;
  technicalSpec: string | null;
  competition: string | null;
  followUpDate: string | null;
  closeResult: string | null;
  lostReason: string | null;
  stagnant: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StageHistory {
  id: string;
  fromStage: StageId | null;
  toStage: StageId;
  changedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completedAt: string | null;
  ownerId: string;
}

interface Customer { id: string; name: string; }

const STAGE_LABELS: Record<string, string> = {
  identified_need: "Identifikovaná potreba",
  qualified: "Kvalifikovaný",
  technical_solution: "Technické riešenie",
  quote_delivered: "Ponuka odoslaná",
  negotiation: "Rokovanie",
  verbal_confirmed: "Verbálne potvrdený",
  won: "Vyhratý ✓",
  lost: "Stratený ✗",
};

function fmt(n: string | null) {
  if (!n) return "–";
  return `€ ${Number(n).toLocaleString("sk-SK")}`;
}

function dateStr(d: string) {
  return new Date(d).toLocaleDateString("sk-SK");
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<StageId | "">("");
  const [gateForm, setGateForm] = useState<Record<string, string>>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "" });
  const [stageError, setStageError] = useState("");

  const { data: opp, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", id],
    queryFn: () => api(`/opportunities/${id}`),
  });

  const { data: history = [] } = useQuery<StageHistory[]>({
    queryKey: ["opp-history", id],
    queryFn: () => api(`/opportunities/${id}/history`),
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["opp-tasks", id],
    queryFn: () => api(`/tasks?opportunityId=${id}`),
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ["customer", opp?.customerId],
    queryFn: () => api(`/customers/${opp!.customerId}`),
    enabled: !!opp?.customerId,
  });

  const moveStage = useMutation({
    mutationFn: (body: object) =>
      api(`/opportunities/${id}/stage`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["opportunity", id] });
      await qc.invalidateQueries({ queryKey: ["opp-history", id] });
      await qc.invalidateQueries({ queryKey: ["opportunities"] });
      setMoveStageOpen(false);
      setTargetStage("");
      setGateForm({});
      setStageError("");
    },
    onError: (e: any) => setStageError(e.message),
  });

  const createTask = useMutation({
    mutationFn: (body: object) =>
      api("/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["opp-tasks", id] });
      setShowTaskForm(false);
      setTaskForm({ title: "", dueDate: "" });
    },
  });

  const completeTask = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      api(`/tasks/${taskId}/complete`, { method: "PATCH", body: JSON.stringify({ completed }) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["opp-tasks", id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      api(`/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["opp-tasks", id] });
    },
  });

  const validTargets = opp
    ? PIPELINE_STAGES
        .filter((s) => isValidTransition(opp.stage, s.id))
        .map((s) => s.id)
    : [];

  useEffect(() => {
    if (!opp) {
      return;
    }

    const requestedStage = searchParams.get("stage");

    if (!requestedStage) {
      return;
    }

    if (validTargets.includes(requestedStage as StageId)) {
      setMoveStageOpen(true);
      setTargetStage(requestedStage as StageId);
      setGateForm({});
      setStageError("");
    }

    setSearchParams({}, { replace: true });
  }, [opp, searchParams, setSearchParams, validTargets]);

  if (isLoading || !opp) return <p className="text-gray-400 text-sm">Načítavam…</p>;

  const isClosed = opp.stage === "won" || opp.stage === "lost";

  function submitStageMove(e: React.FormEvent) {
    e.preventDefault();
    if (!targetStage) return;
    const body: Record<string, unknown> = { stage: targetStage, ...gateForm };
    if (targetStage === "won" && body.closeTimestamp === undefined) {
      body.closeTimestamp = new Date().toISOString();
    }
    moveStage.mutate(body);
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/pipeline" className="hover:underline">Pipeline</Link>
        {customer && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{opp.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">{opp.title}</h2>
            {customer && (
              <p className="text-sm text-gray-500 mb-3">
                <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:underline">{customer.name}</Link>
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Fáza:{" "}
                <span className={`font-medium px-2 py-0.5 rounded text-xs ${opp.stage === "won" ? "bg-green-100 text-green-700" : opp.stage === "lost" ? "bg-red-100 text-red-700" : opp.stagnant ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {STAGE_LABELS[opp.stage] ?? opp.stage}
                </span>
              </span>
              <span>Hodnota: <strong>{fmt(opp.value)}</strong></span>
              <span>Ďalší krok: <strong className="text-gray-700">{opp.nextStepSummary}</strong></span>
              <span>Deadline: <strong>{opp.nextStepDeadline}</strong></span>
            </div>
            {opp.stagnant && !isClosed && (
              <p className="mt-2 text-xs text-amber-600 font-medium">⚠ Príležitosť stagnuje viac ako 30 dní</p>
            )}
            {opp.competition && <p className="mt-1 text-xs text-gray-500">Konkurencia: {opp.competition}</p>}
            {opp.lostReason && <p className="mt-1 text-xs text-red-600">Dôvod straty: {opp.lostReason}</p>}
          </div>

          {!isClosed && (
            <button
              data-testid="move-stage-button"
              onClick={() => setMoveStageOpen(!moveStageOpen)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 md:self-start"
            >
              Posunúť fázu
            </button>
          )}
        </div>

        {/* Move stage form */}
        {moveStageOpen && !isClosed && (
          <form onSubmit={submitStageMove} className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 md:grid-cols-2">
            <div className="col-span-2">
              {stageError && <p className="text-red-600 text-sm mb-2">{stageError}</p>}
              <select
                required
                value={targetStage}
                onChange={(e) => { setTargetStage(e.target.value as StageId); setGateForm({}); setStageError(""); }}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              >
                <option value="">Vybrať novú fázu…</option>
                {validTargets.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>
                ))}
              </select>
            </div>

            {/* Gate fields for quote_delivered */}
            {targetStage === "quote_delivered" && (
              <>
                <input required placeholder="Technická špecifikácia" className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
                  value={gateForm.technicalSpec ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, technicalSpec: e.target.value }))} />
                <input required placeholder="Konkurencia" className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={gateForm.competition ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, competition: e.target.value }))} />
                <input required type="date" placeholder="Follow-up dátum" className="border border-gray-300 rounded px-3 py-2 text-sm"
                  aria-label="Follow-up dátum"
                  value={gateForm.followUpDate ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, followUpDate: e.target.value }))} />
              </>
            )}

            {/* Gate fields for won */}
            {targetStage === "won" && (
              <>
                <input required placeholder="Výsledok uzávierky" className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
                  value={gateForm.closeResult ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, closeResult: e.target.value }))} />
              </>
            )}

            {/* Gate fields for lost */}
            {targetStage === "lost" && (
              <>
                <input required placeholder="Dôvod straty" className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={gateForm.lostReason ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, lostReason: e.target.value }))} />
                <input required placeholder="Výsledok" className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={gateForm.closeResult ?? ""} onChange={(e) => setGateForm((f) => ({ ...f, closeResult: e.target.value }))} />
              </>
            )}

            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setMoveStageOpen(false)} className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50">Zrušiť</button>
              <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Potvrdiť posun</button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Úlohy / Ďalšie kroky</h3>
            {!isClosed && (
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="text-xs text-blue-600 hover:underline">
                {showTaskForm ? "Zavrieť" : "+ Nová úloha"}
              </button>
            )}
          </div>

          {showTaskForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTask.mutate({ ...taskForm, opportunityId: id });
              }}
              className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <input required placeholder="Popis úlohy" value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm col-span-2" />
              <input required type="date" value={taskForm.dueDate}
                aria-label="Termín úlohy"
                onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
              <button type="submit" className="text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700">
                Uložiť
              </button>
            </form>
          )}

          {tasks.length === 0 ? (
            <p className="text-xs text-gray-400">Žiadne úlohy.</p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className={`flex items-start gap-2 text-sm rounded px-2 py-1.5 ${t.completedAt ? "opacity-50 bg-gray-50" : new Date(t.dueDate) < new Date() ? "bg-red-50" : "bg-white"}`}>
                  <input
                    type="checkbox"
                    checked={!!t.completedAt}
                    onChange={(event) => completeTask.mutate({ taskId: t.id, completed: event.target.checked })}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium leading-tight ${t.completedAt ? "line-through" : ""}`}>{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                    <p className="text-xs text-gray-400">{t.dueDate}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Zmazať úlohu ${t.title}`}
                    onClick={() => deleteTask.mutate(t.id)}
                    className="text-xs text-gray-300 hover:text-red-500 shrink-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stage history */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">História fáz</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">Žiadna história.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-3">
              {history.map((h) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1 w-3 h-3 bg-blue-200 rounded-full border border-white" />
                  <p className="text-sm font-medium">
                    {h.fromStage ? `${STAGE_LABELS[h.fromStage] ?? h.fromStage} → ` : ""}
                    <span className="text-blue-700">{STAGE_LABELS[h.toStage] ?? h.toStage}</span>
                  </p>
                  <p className="text-xs text-gray-400">{dateStr(h.changedAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
