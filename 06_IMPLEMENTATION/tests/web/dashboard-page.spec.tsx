import React from "react";
import "./setup.ts";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../../apps/web/src/pages/DashboardPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("renders planner preview alongside dashboard metrics", async () => {
    apiMock.mockResolvedValueOnce({
      customerCount: 8,
      totalPipeline: 220000,
      weightedPipeline: 110000,
      wonTotal: 45000,
      lostTotal: 10000,
      annualRevenueTarget: 900000,
      coverageRatio: 2.2,
      openCount: 4,
      visitCount: 7,
      conversionRate: 43,
      winRate: 55,
      avgDealSize: 22500,
      crossSellRate: 33,
      stagnantCount: 1,
      overdueCount: 2,
      lostReasons: { Cena: 1 },
      plannerPreview: {
        summary: {
          overdueCount: 2,
          dueTodayCount: 1,
          dueThisWeekCount: 3,
          laterCount: 4,
          totalCount: 10,
        },
        previewItems: [
          {
            id: "opp-1",
            sourceType: "opportunity",
            customerName: "ACME",
            title: "Rozpracovaná ponuka",
            nextStep: "Poslať cenový update",
            dueDate: "2026-04-28",
            status: "this_week",
            stage: "qualified",
            visitDate: null,
          },
        ],
      },
      top10: [],
      semaphore: "POZOR",
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/dashboard"));
    expect(await screen.findByText("Môj plán práce na najbližší týždeň")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otvoriť plán práce" })).toHaveAttribute("href", "/planner");
    expect(screen.getByText("Rozpracovaná ponuka")).toBeInTheDocument();
    expect(screen.getByText("Poslať cenový update")).toBeInTheDocument();
  });

  it("shows an error state when dashboard loading fails", async () => {
    apiMock.mockRejectedValueOnce(new Error("Dashboard error"));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("Dashboard error")).toBeInTheDocument();
  });
});