import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.tsx";

export function Layout() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Načítavam…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    ...(user.role === "sales" ? [{ to: "/planner", label: "Plán práce" }] : []),
    { to: "/customers", label: "Zákazníci" },
    { to: "/visits", label: "Návštevy" },
    { to: "/pipeline", label: "Pipeline" },
    { to: "/import", label: "Import" },
    ...(user.role === "manager" ? [
      { to: "/report", label: "Report" },
      { to: "/settings/users", label: "Používatelia" },
    ] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:flex-row">
      {/* Sidebar */}
      <aside className="sticky top-0 z-20 w-full bg-white border-b border-gray-200 p-3 shadow-sm md:static md:w-56 md:border-b-0 md:border-r md:p-4 md:shadow-none md:flex-shrink-0 md:flex md:flex-col">
        <div className="mb-3 flex items-center justify-between px-2 md:mb-6 md:block md:px-0">
          <h1 className="text-lg font-bold">Marpex CRM</h1>
          <p className="text-xs text-gray-500 md:hidden">{user.name}</p>
        </div>
        <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto pb-1 md:flex md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-3 border-t border-gray-200 pt-3 md:mt-3">
          <p className="mb-2 hidden px-2 text-xs text-gray-500 md:block">{user.name}</p>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-600 px-2"
          >
            Odhlásiť sa
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
