import React from "react";
import "./setup.ts";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerPage } from "../../apps/web/src/pages/PlannerPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("PlannerPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("renders grouped upcoming work items", async () => {
    apiMock.mockResolvedValueOnce({
      summary: {
        overdueCount: 1,
        dueTodayCount: 1,
        dueThisWeekCount: 1,
        laterCount: 1,
        totalCount: 4,
      },
      windowStart: "2026-04-27",
      windowEnd: "2026-05-04",
      items: [
        {
          id: "opp-1",
          sourceType: "opportunity",
          customerId: "cust-1",
          customerName: "ACME",
          title: "Ponuka pre ACME",
          nextStep: "Zavolať nákupcovi",
          dueDate: "2026-04-26",
          status: "overdue",
          stage: "qualified",
          visitDate: null,
          value: 12000,
        },
        {
          id: "visit-1",
          sourceType: "visit",
          customerId: "cust-2",
          customerName: "Beta",
          title: "Návšteva 2026-04-27",
          nextStep: "Poslať recap",
          dueDate: "2026-04-27",
          status: "today",
          stage: null,
          visitDate: "2026-04-22",
          value: 5000,
        },
        {
          id: "opp-2",
          sourceType: "opportunity",
          customerId: "cust-3",
          customerName: "Gamma",
          title: "Cross-sell Gamma",
          nextStep: "Pripraviť ponuku",
          dueDate: "2026-04-30",
          status: "this_week",
          stage: "technical_solution",
          visitDate: null,
          value: 18000,
        },
        {
          id: "visit-2",
          sourceType: "visit",
          customerId: "cust-4",
          customerName: "Delta",
          title: "Návšteva 2026-05-10",
          nextStep: "Dohodnúť demo",
          dueDate: "2026-05-15",
          status: "later",
          stage: null,
          visitDate: "2026-05-10",
          value: 9000,
        },
      ],
    });

    renderWithProviders(<PlannerPage />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/dashboard/planner"));
    expect(await screen.findByText("Plán práce")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Po termíne" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nasledujúcich 7 dní" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Neskôr" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ponuka pre ACME/i })).toHaveAttribute("href", "/pipeline/opp-1");
    expect(screen.getByRole("link", { name: /Návšteva 2026-04-27/i })).toHaveAttribute("href", "/visits/visit-1");
    expect(screen.getByText("Zavolať nákupcovi")).toBeInTheDocument();
  });

  it("shows empty state when no next steps are planned", async () => {
    apiMock.mockResolvedValueOnce({
      summary: {
        overdueCount: 0,
        dueTodayCount: 0,
        dueThisWeekCount: 0,
        laterCount: 0,
        totalCount: 0,
      },
      windowStart: "2026-04-27",
      windowEnd: "2026-05-04",
      items: [],
    });

    renderWithProviders(<PlannerPage />);

    expect(await screen.findByText("Žiadne naplánované next stepy")).toBeInTheDocument();
  });

  it("shows an error state when planner loading fails", async () => {
    apiMock.mockRejectedValueOnce(new Error("Planner error"));

    renderWithProviders(<PlannerPage />);

    expect(await screen.findByText("Planner error")).toBeInTheDocument();
  });
});