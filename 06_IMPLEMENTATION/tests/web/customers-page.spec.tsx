import React from "react";
import "./setup.ts";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { CustomersPage } from "../../apps/web/src/pages/CustomersPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function formatCurrency(value: string) {
  return `€ ${Number(value).toLocaleString("sk-SK")}`;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function renderCustomersPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<div>Customer route</div>} />
    </Routes>,
    { route: "/customers" },
  );
}

describe("CustomersPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("shows current and previous year revenue columns", async () => {
    const currentYear = new Date().getFullYear();

    apiMock.mockResolvedValue([
      {
        id: "customer-1",
        name: "Acme a.s.",
        segment: "integrator",
        strategicCategory: "A",
        currentYearRevenue: "125000.50",
        previousYearRevenue: "83000.25",
        potential: "220000",
      },
    ]);

    renderCustomersPage();

    expect(await screen.findByText("Acme a.s.")).toBeInTheDocument();
    expect(screen.getByText(`Tržby ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText(`Tržby ${currentYear - 1}`)).toBeInTheDocument();
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("125000.50")))).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("83000.25")))).toBeInTheDocument();
  });
});