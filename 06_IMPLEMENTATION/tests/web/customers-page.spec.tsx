import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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

  it("shows source-data customer columns and filters by industry", async () => {
    const currentYear = new Date().getFullYear();

    apiMock.mockImplementation(async (path: string) => {
      if (path === "/customers") {
        return [
          {
            id: "customer-1",
            name: "Acme a.s.",
            segment: "oem",
            industry: "oem",
            ico: "12345678",
            city: "Nitra",
            region: "Nitriansky",
            currentYearRevenue: "125000.50",
            previousYearRevenue: "83000.25",
            annualRevenuePlan: "220000",
            annualRevenuePlanYear: currentYear,
          },
        ];
      }

      if (path === "/customers?industry=mobile_equipment") {
        return [];
      }

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderCustomersPage();

    expect(await screen.findByText("Acme a.s.")).toBeInTheDocument();
    expect(screen.getByText("Odvetvie")).toBeInTheDocument();
    expect(screen.getByText("IČO")).toBeInTheDocument();
    expect(screen.getByText("Mesto")).toBeInTheDocument();
    expect(screen.getByText("Kraj")).toBeInTheDocument();
    expect(screen.getByText(`Tržby ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText(`Tržby ${currentYear - 1}`)).toBeInTheDocument();
    expect(screen.getByText("Plán")).toBeInTheDocument();
    expect(screen.getAllByText("OEM").length).toBeGreaterThan(0);
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("Nitra")).toBeInTheDocument();
    expect(screen.getByText("Nitriansky")).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("125000.50")))).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("83000.25")))).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("220000")))).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "mobile_equipment" } });

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/customers?industry=mobile_equipment");
    });
  });
});