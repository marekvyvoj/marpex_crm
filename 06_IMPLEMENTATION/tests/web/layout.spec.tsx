import React from "react";
import "./setup.ts";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { Layout } from "../../apps/web/src/components/Layout.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const logoutMock = vi.fn();
let authState: { user: { name: string; role: "manager" | "sales" } | null; loading: boolean; logout: () => Promise<void> | void };

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => authState,
}));

function renderLayout(route = "/dashboard") {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login route</div>} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<div>Dashboard content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("Layout", () => {
  it("shows loading state", () => {
    authState = { user: null, loading: true, logout: logoutMock };
    renderLayout();

    expect(screen.getByText("Načítavam…")).toBeInTheDocument();
  });

  it("redirects guests to login", async () => {
    authState = { user: null, loading: false, logout: logoutMock };
    renderLayout();

    expect(await screen.findByText("Login route")).toBeInTheDocument();
  });

  it("renders manager navigation and triggers logout", () => {
    logoutMock.mockResolvedValue(undefined);
    authState = { user: { name: "Manažér", role: "manager" }, loading: false, logout: logoutMock };
    renderLayout();

    expect(screen.queryByRole("link", { name: "Plán práce" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Používatelia" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Odhlásiť sa" }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("hides manager-only navigation for salesperson", () => {
    authState = { user: { name: "Sales", role: "sales" }, loading: false, logout: logoutMock };
    renderLayout();

    expect(screen.getByRole("link", { name: "Plán práce" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Report" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Používatelia" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });
});