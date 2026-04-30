import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { CustomersPage } from "../../apps/web/src/pages/CustomersPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => useAuthMock(),
}));

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
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: "sales-1", name: "Obchodník", email: "sales@example.test", role: "sales" },
      loading: false,
    });
  });

  it("shows sortable customer columns and filters inside the table header", async () => {
    const currentYear = new Date().getFullYear();

    apiMock.mockImplementation(async (path: string) => {
      if (path === "/customers") {
        return [
          {
            id: "customer-1",
            name: "Acme a.s.",
            segment: "oem",
            industry: "oem",
            ownerId: "sales-1",
            ownerName: "Rastislav Bušík",
            resolverIds: ["sales-2", "sales-3"],
            resolverNames: ["Patrik Bača", "Dušan Gabriška"],
            ico: "12345678",
            city: "Nitra",
            district: "Nitra-okolie",
            region: "Nitriansky",
            currentYearRevenue: "125000.50",
            previousYearRevenue: "83000.25",
            annualRevenuePlan: "220000",
            annualRevenuePlanYear: currentYear,
          },
          {
            id: "customer-2",
            name: "Beta Systems s.r.o.",
            segment: "vyroba",
            industry: "mobile_equipment",
            ownerId: null,
            ownerName: null,
            resolverIds: [],
            resolverNames: [],
            ico: "87654321",
            city: "Topoľčany",
            district: "Topoľčany-okolie",
            region: "Nitriansky",
            currentYearRevenue: "225000",
            previousYearRevenue: "132000",
            annualRevenuePlan: "260000",
            annualRevenuePlanYear: currentYear,
          },
        ];
      }

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderCustomersPage();

    expect(await screen.findByText("Acme a.s.")).toBeInTheDocument();
  expect(screen.getByText("Vlastník")).toBeInTheDocument();
  expect(screen.getByText("Riešitelia")).toBeInTheDocument();
    expect(screen.getByText("Odvetvie")).toBeInTheDocument();
    expect(screen.getByText("IČO")).toBeInTheDocument();
    expect(screen.getByText("Mesto")).toBeInTheDocument();
    expect(screen.getByText("Okres")).toBeInTheDocument();
    expect(screen.getByText("Kraj")).toBeInTheDocument();
    expect(screen.getByText("Tržby Finstat 24/25")).toBeInTheDocument();
    expect(screen.getByText(`Tržby ${currentYear - 1}`)).toBeInTheDocument();
    expect(screen.getByText("Plán")).toBeInTheDocument();
    expect(screen.queryByText("Segment")).not.toBeInTheDocument();
    expect(screen.getAllByText("OEM").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mobile Equipment").length).toBeGreaterThan(0);
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("Rastislav Bušík")).toBeInTheDocument();
    expect(screen.getByText("Patrik Bača, Dušan Gabriška")).toBeInTheDocument();
    expect(screen.getByText("Nepriradené")).toBeInTheDocument();
    expect(screen.getByText("Bez riešiteľov")).toBeInTheDocument();
    expect(screen.getByText("Nitra")).toBeInTheDocument();
    expect(screen.getByText("Nitra-okolie")).toBeInTheDocument();
    expect(screen.getByText("Topoľčany")).toBeInTheDocument();
    expect(screen.getByText("Topoľčany-okolie")).toBeInTheDocument();
    expect(screen.getAllByText("Nitriansky").length).toBeGreaterThan(0);
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("125000.50")))).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("83000.25")))).toBeInTheDocument();
    expect(screen.getByText((_, element) => normalizeText(element?.textContent ?? "") === normalizeText(formatCurrency("220000")))).toBeInTheDocument();

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Acme a.s.",
      "Beta Systems s.r.o.",
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Tržby Finstat 24\/25/i }));

    await waitFor(() => {
      expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
        "Beta Systems s.r.o.",
        "Acme a.s.",
      ]);
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mobile_equipment" } });

    await waitFor(() => {
      expect(screen.queryByText("Acme a.s.")).not.toBeInTheDocument();
      expect(screen.getByText("Beta Systems s.r.o.")).toBeInTheDocument();
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith("/customers");
  });

  it("lets a salesperson switch the customer list to all salespeople", async () => {
    apiMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    renderCustomersPage();

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/customers"));

    fireEvent.click(screen.getByRole("button", { name: "Všetci obchodníci" }));

    await waitFor(() => expect(apiMock).toHaveBeenLastCalledWith("/customers?scope=all"));
  });
});