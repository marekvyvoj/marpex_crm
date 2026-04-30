import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { OpportunityDetailPage } from "../../apps/web/src/pages/OpportunityDetailPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function renderOpportunityDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/pipeline" element={<div>Pipeline route</div>} />
      <Route path="/customers/:id" element={<div>Customer route</div>} />
      <Route path="/pipeline/:id" element={<OpportunityDetailPage />} />
    </Routes>,
    { route: "/pipeline/opp-1" },
  );
}

describe("OpportunityDetailPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: "sales-1", role: "sales" },
      loading: false,
    });
  });

  it("allows a completed task to be marked back as incomplete", async () => {
    let tasks = [
      {
        id: "task-1",
        title: "Zavolať zákazníkovi",
        description: null,
        dueDate: "2026-05-12",
        completedAt: null,
        ownerId: "user-1",
      },
    ];

    apiMock.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/opportunities/opp-1") {
        return {
          id: "opp-1",
          title: "Phase5 Opportunity",
          customerId: "customer-1",
          stage: "qualified",
          value: "23000",
          nextStepSummary: "Pripraviť call",
          nextStepDeadline: "2026-05-20",
          technicalSpec: null,
          competition: null,
          followUpDate: null,
          closeResult: null,
          lostReason: null,
          stagnant: false,
          createdAt: "2026-05-01T10:00:00.000Z",
          updatedAt: "2026-05-01T10:00:00.000Z",
        };
      }

      if (path === "/opportunities/opp-1/history") return [];
      if (path === "/tasks?opportunityId=opp-1") return tasks;
      if (path === "/customers/customer-1") return { id: "customer-1", name: "Acme a.s." };

      if (path === "/tasks/task-1/complete") {
        const body = JSON.parse(init?.body ?? "{}");
        tasks = tasks.map((task) => (
          task.id === "task-1"
            ? { ...task, completedAt: body.completed ? "2026-05-02T10:00:00.000Z" : null }
            : task
        ));
        return tasks[0];
      }

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderOpportunityDetail();

    const checkbox = await screen.findByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
    expect(apiMock).toHaveBeenCalledWith(
      "/tasks/task-1/complete",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ completed: true }) }),
    );

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
    expect(apiMock).toHaveBeenCalledWith(
      "/tasks/task-1/complete",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ completed: false }) }),
    );
  });

  it("assigns a new task to another salesperson", async () => {
    let tasks = [
      {
        id: "task-1",
        title: "Zavolať zákazníkovi",
        description: null,
        dueDate: "2026-05-12",
        completedAt: null,
        ownerId: "sales-1",
        ownerName: "Obchodník",
      },
    ];

    apiMock.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/opportunities/opp-1") {
        return {
          id: "opp-1",
          title: "Phase5 Opportunity",
          customerId: "customer-1",
          ownerId: "sales-1",
          stage: "qualified",
          value: "23000",
          nextStepSummary: "Pripraviť call",
          nextStepDeadline: "2026-05-20",
          technicalSpec: null,
          competition: null,
          followUpDate: null,
          closeResult: null,
          lostReason: null,
          stagnant: false,
          createdAt: "2026-05-01T10:00:00.000Z",
          updatedAt: "2026-05-01T10:00:00.000Z",
        };
      }

      if (path === "/opportunities/opp-1/history") return [];
      if (path === "/tasks?opportunityId=opp-1") return tasks;
      if (path === "/customers/customer-1") return { id: "customer-1", name: "Acme a.s." };
      if (path === "/users/sales-options") {
        return [
          { id: "sales-1", name: "Obchodník", role: "sales", active: true },
          { id: "sales-2", name: "Patrik Bača", role: "sales", active: true },
        ];
      }

      if (path === "/tasks" && init?.method === "POST") {
        const body = JSON.parse(init.body ?? "{}");
        tasks = [
          ...tasks,
          {
            id: "task-2",
            title: body.title,
            description: null,
            dueDate: body.dueDate,
            completedAt: null,
            ownerId: body.ownerId,
            ownerName: "Patrik Bača",
          },
        ];
        return tasks[1];
      }

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderOpportunityDetail();

    fireEvent.click(await screen.findByRole("button", { name: "+ Nová úloha" }));
    await screen.findByRole("option", { name: "Patrik Bača" });
    fireEvent.change(screen.getByPlaceholderText("Popis úlohy"), { target: { value: "Delegovaná úloha" } });
    fireEvent.change(screen.getByLabelText("Termín úlohy"), { target: { value: "2026-05-15" } });
    fireEvent.change(screen.getByLabelText("Riešiteľ úlohy"), { target: { value: "sales-2" } });
    fireEvent.submit(screen.getByRole("button", { name: "Uložiť" }).closest("form")!);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/tasks",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            title: "Delegovaná úloha",
            dueDate: "2026-05-15",
            ownerId: "sales-2",
            opportunityId: "opp-1",
          }),
        }),
      );
    });
  });
});