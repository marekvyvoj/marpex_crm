import React from "react";
import "./setup.ts";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { VisitDetailPage } from "../../apps/web/src/pages/VisitDetailPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("VisitDetailPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (path: string) => {
      if (path === "/visits/visit-1") {
        return {
          id: "visit-1",
          date: "2026-04-25",
          customerId: "customer-1",
          contactId: "contact-1",
          visitGoal: "Servisný audit",
          result: "Dohodnutý follow-up call",
          customerNeed: "Zákazník chce kratší reakčný čas",
          notes: "Treba doplniť ponuku na servisnú zmluvu a preveriť SLA do konca týždňa.",
          opportunityCreated: true,
          opportunityType: "service",
          potentialEur: "12000",
          competition: "Lokálny servisný partner",
          nextStep: "Poslať návrh servisu",
          nextStepDeadline: "2026-04-30",
          lateFlag: true,
          createdAt: "2026-04-25T08:00:00.000Z",
          updatedAt: "2026-04-25T10:30:00.000Z",
        };
      }

      if (path === "/customers/customer-1") {
        return { id: "customer-1", name: "Acme a.s.", segment: "integrator" };
      }

      if (path === "/customers/customer-1/contacts") {
        return [
          {
            id: "contact-1",
            firstName: "Ján",
            lastName: "Novák",
            role: "decision_maker",
            email: "jan.novak@example.test",
            phone: "0900123456",
          },
        ];
      }

      throw new Error(`Unhandled api call: ${path}`);
    });
  });

  it("renders all relevant visit information including free-text notes", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/visits" element={<div>Návštevy route</div>} />
        <Route path="/customers/:id" element={<div>Zákazník route</div>} />
        <Route path="/visits/:id" element={<VisitDetailPage />} />
      </Routes>,
      { route: "/visits/visit-1" },
    );

    expect(await screen.findByRole("heading", { name: "Návšteva z 2026-04-25" })).toBeInTheDocument();
    expect(screen.getByText("Treba doplniť ponuku na servisnú zmluvu a preveriť SLA do konca týždňa.")).toBeInTheDocument();
    expect(screen.getByText("Zadané oneskorene")).toBeInTheDocument();
    expect((await screen.findAllByText("Ján Novák")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Projekt", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText("Servis")).toBeInTheDocument();
  });
});