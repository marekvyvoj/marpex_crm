import { useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PIPELINE_STAGES, GATED_STAGES, type StageId } from "@marpex/domain";
import { api } from "../lib/api.ts";
import { FilterableSelect } from "../components/FilterableSelect.tsx";

interface Opportunity {
  id: string;
  title: string;
  value: string;
  stage: StageId;
  nextStepSummary: string;
  nextStepDeadline: string;
  stagnant: boolean;
  customerId: string;
}

interface Customer { id: string; name: string; }

export function PipelinePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);
  const [dndError, setDndError] = useState<string | null>(null);
  const [suppressClickUntil, setSuppressClickUntil] = useState(0);

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: () => api("/opportunities"),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api("/customers"),
  });

  const customerOptions = customers.map((customer) => ({ value: customer.id, label: customer.name }));

  const [form, setForm] = useState({
    title: "",
    customerId: "",
    value: "",
    stage: "identified_need" as StageId,
    nextStepSummary: "",
    nextStepDeadline: "",
  });

  const create = useMutation({
    mutationFn: () =>
      api("/opportunities", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      setShowForm(false);
      setForm({ title: "", customerId: "", value: "", stage: "identified_need", nextStepSummary: "", nextStepDeadline: "" });
    },
  });

  const moveStage = useMutation({
    mutationFn: ({ oppId, stage }: { oppId: string; stage: StageId }) =>
      api(`/opportunities/${oppId}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
    onError: (_err, vars) => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      navigate(`/pipeline/${vars.oppId}`);
    },
  });

  function handleDragStart(e: DragEvent<HTMLDivElement>, oppId: string) {
    e.dataTransfer.setData("oppId", oppId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(oppId);
    setDndError(null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, targetStage: StageId) {
    e.preventDefault();
    setDragOverStage(null);
    setSuppressClickUntil(Date.now() + 250);
    const oppId = e.dataTransfer.getData("oppId");
    if (!oppId) return;
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage === targetStage) return;
    // Gate-required stages: navigate to detail so user fills the form
    if (GATED_STAGES[targetStage]) {
      setDndError("Fáza vyžaduje vyplnenie gate formulára. Otváram detail príležitosti.");
      navigate(`/pipeline/${oppId}?stage=${targetStage}`);
      return;
    }
    moveStage.mutate({ oppId, stage: targetStage });
  }

  const openStages = PIPELINE_STAGES.filter((s) => s.type === "open");

  function oppsByStage(stageId: StageId) {
    return opportunities.filter((o) => o.stage === stageId);
  }

  const totalWeighted = opportunities
    .filter((o) => o.stage !== "won" && o.stage !== "lost")
    .reduce((sum, o) => {
      const stage = PIPELINE_STAGES.find((s) => s.id === o.stage);
      return sum + Number(o.value) * ((stage?.weight ?? 0) / 100);
    }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Pipeline</h2>
          <p className="text-sm text-gray-500">
            Weighted pipeline: <span className="font-semibold text-gray-800">€ {totalWeighted.toLocaleString("sk-SK", { maximumFractionDigits: 0 })}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Zavrieť" : "+ Nová príležitosť"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-3 gap-3"
        >
          <input placeholder="Názov príležitosti" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input col-span-2" />
          <FilterableSelect
            options={customerOptions}
            value={form.customerId}
            onChange={(customerId) => setForm({ ...form, customerId })}
            required
            emptyOptionLabel="Zákazník"
            searchLabel="Filtrovať zákazníkov v pipeline formulári"
            searchPlaceholder="Hľadať zákazníka pre príležitosť..."
            selectAriaLabel="Zákazník pre príležitosť"
          />
          <input type="number" step="0.01" placeholder="Hodnota €" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="input" />
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as StageId })} className="input">
            {PIPELINE_STAGES.filter((s) => s.type === "open").map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <input placeholder="Next step" value={form.nextStepSummary} onChange={(e) => setForm({ ...form, nextStepSummary: e.target.value })} required className="input" />
          <input type="date" value={form.nextStepDeadline} onChange={(e) => setForm({ ...form, nextStepDeadline: e.target.value })} required className="input" />
          <button type="submit" className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700">Uložiť</button>
        </form>
      )}

      {dndError && (
        <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {dndError}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {openStages.map((stage) => {
          const stageOpps = oppsByStage(stage.id);
          const stageTotal = stageOpps.reduce((s, o) => s + Number(o.value), 0);
          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              data-testid={`pipeline-stage-${stage.id}`}
              className={`relative min-w-[220px] max-w-[260px] flex-shrink-0 rounded-lg border p-3 transition-colors ${
                isOver ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null); }}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{stage.label}</h3>
                <span className="text-xs text-gray-400">{stage.weight}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {stageOpps.length} deal{stageOpps.length !== 1 && "s"} · € {stageTotal.toLocaleString("sk-SK", { maximumFractionDigits: 0 })}
              </p>

              <div className="space-y-2">
                {stageOpps.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Žiadne príležitosti</p>
                ) : stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    data-testid={`pipeline-card-${opp.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                    onClick={() => {
                      if (Date.now() < suppressClickUntil) {
                        return;
                      }

                      navigate(`/pipeline/${opp.id}`);
                    }}
                    className={`block bg-white rounded border p-2 text-xs cursor-pointer hover:shadow-sm transition-all select-none ${
                      opp.stagnant ? "border-red-300" : "border-gray-200"
                    } ${draggingId === opp.id ? "opacity-40" : ""}`}
                  >
                    <p className="font-medium truncate">{opp.title}</p>
                    <p className="text-gray-500">€ {Number(opp.value).toLocaleString("sk-SK")}</p>
                    <p className="text-gray-400 truncate">{opp.nextStepSummary}</p>
                    {opp.stagnant && <span className="text-red-500 font-medium">STAGNANT</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
