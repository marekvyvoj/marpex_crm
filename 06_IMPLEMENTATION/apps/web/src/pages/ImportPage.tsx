import { useState, useRef } from "react";
import { api } from "../lib/api.ts";

interface ImportResult {
  jobId: string;
  total: number;
  imported: number;
  errors: number;
  errorReport?: string[];
}

const EXAMPLE_CSV = `name,segment,category,currentRevenue,potential,contactFirstName,contactLastName,contactRole,contactEmail,contactPhone
Firma ABC s.r.o.,oem,A,120000,350000,Ján,Novák,decision_maker,jan.novak@firma.sk,0900123456
Beta Systémy,vyroba,B,80000,200000,Petra,Kováčová,influencer,petra@beta.sk,`;

export function ImportPage() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function parsePreview(text: string) {
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
    return lines.slice(0, 6).map((l) => l.split(",").map((v) => v.trim().replace(/^"|"$/g, "")));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setPreview(parsePreview(text));
      setResult(null);
      setError("");
    };
    reader.readAsText(file, "utf-8");
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCsvText(e.target.value);
    setPreview(parsePreview(e.target.value));
    setResult(null);
    setError("");
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api<ImportResult>("/import/customers", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Chyba pri importe");
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setCsvText(EXAMPLE_CSV);
    setPreview(parsePreview(EXAMPLE_CSV));
    setResult(null);
    setError("");
  }

  const headerRow = preview[0] ?? [];
  const dataRows = preview.slice(1);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Import zákazníkov z CSV</h2>
        <button onClick={loadExample} className="text-sm text-blue-600 hover:underline">
          Načítať príklad
        </button>
      </div>

      {/* Format description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm text-blue-800">
        <p className="font-medium mb-1">Formát CSV (prvý riadok = hlavička):</p>
        <code className="block overflow-x-auto whitespace-nowrap rounded bg-blue-100 px-2 py-1 text-xs">
          name, segment, category, currentRevenue, potential, contactFirstName, contactLastName, contactRole, contactEmail, contactPhone
        </code>
        <p className="mt-2 text-xs">
          <strong>segment:</strong> oem | vyroba | integrator | servis | other &nbsp;|&nbsp;
          <strong>category:</strong> A | B | C &nbsp;|&nbsp;
          <strong>contactRole:</strong> decision_maker | influencer | user
        </p>
      </div>

      {/* File upload */}
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <label className="cursor-pointer bg-white border border-gray-300 rounded px-4 py-2 text-sm hover:bg-gray-50">
          📁 Vybrať .csv súbor
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </label>
        <span className="text-sm text-gray-400">alebo prilepte obsah nižšie</span>
      </div>

      {/* Text area */}
      <textarea
        value={csvText}
        onChange={handleTextChange}
        rows={8}
        placeholder="Vložte CSV obsah sem…"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Preview table */}
      {preview.length > 1 && (
        <div className="mb-4 overflow-auto border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 border-b">Náhľad (prvých {dataRows.length} riadkov):</p>
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-gray-100">
                {headerRow.map((h, i) => <th key={i} className="px-2 py-1.5 text-left text-gray-500 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="border-t border-gray-100">
                  {row.map((cell, ci) => <td key={ci} className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{cell || <span className="text-gray-300">–</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={loading || !csvText.trim()}
        className="bg-blue-600 text-white text-sm px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Importujem…" : "Spustiť import"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="font-semibold mb-2">Výsledok importu</p>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600">Celkovo: <strong>{result.total}</strong></span>
            <span className="text-green-700">Importovaných: <strong>{result.imported}</strong></span>
            {result.errors > 0 && <span className="text-red-600">Chýb: <strong>{result.errors}</strong></span>}
          </div>
          {result.errorReport && result.errorReport.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-600 mb-1">Chyby:</p>
              <ul className="text-xs text-red-500 space-y-0.5">
                {result.errorReport.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
