import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider.tsx";
import { api } from "../lib/api.ts";

interface User {
  id: string;
  name: string;
  email: string;
  role: "manager" | "sales";
  active: boolean;
  createdAt: string;
}

export function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales" as "manager" | "sales" });
  const [formError, setFormError] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api("/users"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/users", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "sales" });
      setFormError("");
    },
    onError: (e: any) => setFormError(e.message ?? "Chyba"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "manager" | "sales" }) =>
      api(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  if (me?.role !== "manager") {
    return <p className="text-red-600 text-sm">Prístup zamietnutý — len manažér.</p>;
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold">Správa používateľov</h2>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Zavrieť" : "+ Nový používateľ"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2"
        >
          {formError && <p className="col-span-2 text-sm text-red-600">{formError}</p>}
          <input
            required
            placeholder="Meno a priezvisko"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Heslo (min. 8 znakov)"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "manager" | "sales" }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="sales">Obchodník</option>
            <option value="manager">Manažér</option>
          </select>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
              Vytvoriť
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Načítavam…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] bg-white border border-gray-200 rounded-lg text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-2">Meno</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rola</th>
                <th className="px-4 py-2">Stav</th>
                <th className="px-4 py-2 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-gray-100 ${!u.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2 font-medium">
                    {u.name}
                    {u.id === me?.id && <span className="ml-1 text-xs text-blue-500">(ty)</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value as "manager" | "sales" })}
                      disabled={u.id === me?.id}
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="sales">Obchodník</option>
                      <option value="manager">Manažér</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.active ? "Aktívny" : "Neaktívny"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggle.mutate({ id: u.id, active: !u.active })}
                      disabled={u.id === me?.id}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    >
                      {u.active ? "Deaktivovať" : "Aktivovať"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
