import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider.tsx";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Neplatné prihlasovacie údaje");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Marpex CRM</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700">
          Prihlásiť sa
        </button>
      </form>
    </div>
  );
}
