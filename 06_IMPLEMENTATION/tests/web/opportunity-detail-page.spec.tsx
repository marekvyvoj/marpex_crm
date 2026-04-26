import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { OpportunityDetailPage } from "../../apps/web/src/pages/OpportunityDetailPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

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
});