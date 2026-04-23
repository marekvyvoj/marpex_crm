import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelinePage } from "../../apps/web/src/pages/PipelinePage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function createDataTransfer() {
  const store = new Map<string, string>();

  return {
    effectAllowed: "move",
    setData: (type: string, value: string) => {
      store.set(type, value);
    },
    getData: (type: string) => store.get(type) ?? "",
  };
}

const customers = [
  { id: "customer-1", name: "Acme a.s." },
];

let opportunities: Array<{
  id: string;
  title: string;
  value: string;
  stage: "identified_need" | "qualified" | "technical_solution" | "quote_delivered" | "negotiation" | "verbal_confirmed" | "won" | "lost";
  nextStepSummary: string;
  nextStepDeadline: string;
  stagnant: boolean;
  customerId: string;
}> = [];

describe("PipelinePage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    opportunities = [];
    apiMock.mockReset();
    apiMock.mockImplementation((path: string, options?: { method?: string; body?: string }) => {
      if (path === "/customers") {
        return Promise.resolve(customers);
      }

      if (path === "/opportunities" && !options) {
        return Promise.resolve([...opportunities]);
      }

      if (path === "/opportunities/opportunity-1/stage" && options?.method === "PATCH") {
        const body = JSON.parse(options.body ?? "{}");
        opportunities = opportunities.map((opportunity) => (
          opportunity.id === "opportunity-1"
            ? { ...opportunity, stage: body.stage }
            : opportunity
        ));
        return Promise.resolve({ success: true, newStage: body.stage });
      }

      return Promise.resolve([]);
    });
  });

  it("moves an open-stage card forward and refreshes the board", async () => {
    opportunities = [
      {
        id: "opportunity-1",
        title: "Mid Pipeline Deal",
        value: "45000",
        stage: "qualified",
        nextStepSummary: "Call customer",
        nextStepDeadline: "2026-05-05",
        stagnant: false,
        customerId: "customer-1",
      },
    ];

    renderWithProviders(<PipelinePage />);

    await screen.findByText("Mid Pipeline Deal");

    const source = within(screen.getByTestId("pipeline-stage-qualified")).getByTestId("pipeline-card-opportunity-1");
    const target = screen.getByTestId("pipeline-stage-technical_solution");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source, { dataTransfer });

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/opportunities/opportunity-1/stage",
      expect.objectContaining({ method: "PATCH" }),
    ));
    await waitFor(() => expect(screen.getByTestId("pipeline-stage-technical_solution")).toHaveTextContent("Mid Pipeline Deal"));
  });

  it("redirects to detail for gated stage drops and shows the handoff message", async () => {
    opportunities = [
      {
        id: "opportunity-1",
        title: "Gate Pipeline Deal",
        value: "55000",
        stage: "technical_solution",
        nextStepSummary: "Prepare quote",
        nextStepDeadline: "2026-05-05",
        stagnant: false,
        customerId: "customer-1",
      },
    ];

    renderWithProviders(<PipelinePage />);

    await screen.findByText("Gate Pipeline Deal");

    const source = within(screen.getByTestId("pipeline-stage-technical_solution")).getByTestId("pipeline-card-opportunity-1");
    const target = screen.getByTestId("pipeline-stage-quote_delivered");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source, { dataTransfer });

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/pipeline/opportunity-1?stage=quote_delivered"));
    expect(screen.getByText("Fáza vyžaduje vyplnenie gate formulára. Otváram detail príležitosti.")).toBeInTheDocument();
  });
});