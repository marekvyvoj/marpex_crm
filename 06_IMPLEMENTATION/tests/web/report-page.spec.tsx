import React from "react";
import "./setup.ts";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportPage } from "../../apps/web/src/pages/ReportPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

let authUser: { role: "manager" | "sales" } | null = { role: "manager" };
const apiMock = vi.fn();

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("ReportPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("blocks non-manager users", () => {
    authUser = { role: "sales" };
    apiMock.mockResolvedValue([]);
    renderWithProviders(<ReportPage />);

    expect(screen.getByText("Prístup zamietnutý — len manažér.")).toBeInTheDocument();
  });

  it("shows empty state when no report rows exist", async () => {
    authUser = { role: "manager" };
    apiMock.mockResolvedValueOnce([]);
    renderWithProviders(<ReportPage />);

    expect(screen.getByText("Načítavam…")).toBeInTheDocument();
    expect(await screen.findByText("Žiadni obchodníci.")).toBeInTheDocument();
  });

  it("renders summary totals and risk badges", async () => {
    authUser = { role: "manager" };
    apiMock.mockResolvedValueOnce([
      {
        userId: "1",
        name: "High Risk",
        email: "high@example.test",
        active: true,
        visitCount: 4,
        lateVisits: 1,
        conversionRate: 50,
        openOpps: 2,
        openValue: 20000,
        weightedPipeline: 10000,
        wonCount: 1,
        wonValue: 5000,
        lostCount: 1,
        winRate: 50,
        stagnantCount: 2,
        overdueCount: 3,
      },
      {
        userId: "2",
        name: "Medium Risk",
        email: "medium@example.test",
        active: true,
        visitCount: 3,
        lateVisits: 0,
        conversionRate: 33,
        openOpps: 1,
        openValue: 15000,
        weightedPipeline: 7000,
        wonCount: 0,
        wonValue: 0,
        lostCount: 1,
        winRate: 0,
        stagnantCount: 1,
        overdueCount: 0,
      },
      {
        userId: "3",
        name: "Healthy",
        email: "ok@example.test",
        active: false,
        visitCount: 2,
        lateVisits: 0,
        conversionRate: null,
        openOpps: 0,
        openValue: 0,
        weightedPipeline: 0,
        wonCount: 2,
        wonValue: 12000,
        lostCount: 0,
        winRate: null,
        stagnantCount: 0,
        overdueCount: 0,
      },
    ]);

    renderWithProviders(<ReportPage />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/report/salesperson"));
    expect(await screen.findByText("Report obchodníkov")).toBeInTheDocument();
    expect(screen.getByText("RIZIKO")).toBeInTheDocument();
    expect(screen.getByText("POZOR")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Návštevy celkom").previousElementSibling).toHaveTextContent("9");
    expect(screen.getByText("Won celkom").previousElementSibling).toHaveTextContent(/€\s*17\s000/);
  });
});