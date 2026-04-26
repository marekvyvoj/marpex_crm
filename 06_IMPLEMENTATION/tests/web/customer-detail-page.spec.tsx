import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { CustomerDetailPage } from "../../apps/web/src/pages/CustomerDetailPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function renderCustomerDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/customers" element={<div>Zákazníci route</div>} />
      <Route path="/pipeline/:id" element={<div>Opportunity route</div>} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
    </Routes>,
    { route: "/customers/customer-1" },
  );
}

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("updates customer header data and creates a contact", async () => {
    let customer = {
      id: "customer-1",
      name: "Phase5 Customer Detail",
      segment: "integrator",
      currentRevenue: "120000",
      annualRevenuePlan: "180000",
      annualRevenuePlanYear: 2026,
      potential: "330000",
      shareOfWallet: 35,
      strategicCategory: "B",
      createdAt: "2026-04-19T10:00:00.000Z",
    };
    let contacts = [
      {
        id: "contact-1",
        firstName: "Eva",
        lastName: "Kontaktová",
        role: "decision_maker",
        position: "CEO",
        email: "eva@example.test",
        phone: "0900111222",
      },
    ];
    const visits = [];
    const opportunities = [];

    apiMock.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/customers/customer-1") {
        if (init?.method === "PATCH") {
          const body = JSON.parse(init.body ?? "{}");
          customer = {
            ...customer,
            ...body,
            currentRevenue: body.currentRevenue !== undefined ? String(body.currentRevenue) : customer.currentRevenue,
            annualRevenuePlan: body.annualRevenuePlan !== undefined && body.annualRevenuePlan !== null ? String(body.annualRevenuePlan) : body.annualRevenuePlan === null ? null : customer.annualRevenuePlan,
            annualRevenuePlanYear: body.annualRevenuePlanYear !== undefined ? body.annualRevenuePlanYear : customer.annualRevenuePlanYear,
            potential: body.potential !== undefined ? String(body.potential) : customer.potential,
            strategicCategory: body.strategicCategory ?? customer.strategicCategory,
          };
        }
        return customer;
      }

      if (path === "/customers/customer-1/contacts") {
        if (init?.method === "POST") {
          const body = JSON.parse(init.body ?? "{}");
          const created = {
            id: `contact-${contacts.length + 1}`,
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
            position: body.position ?? null,
            email: body.email ?? null,
            phone: body.phone ?? null,
          };
          contacts = [...contacts, created];
          return created;
        }
        return contacts;
      }

      if (path === "/customers/customer-1/visits") return visits;
      if (path === "/customers/customer-1/opportunities") return opportunities;

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderCustomerDetail();

    expect(await screen.findByRole("heading", { name: "Phase5 Customer Detail" })).toBeInTheDocument();
    expect(screen.getByText(/Segment:/)).toHaveTextContent("integrator");

    fireEvent.click(screen.getByRole("button", { name: "Upraviť" }));
    fireEvent.change(screen.getByPlaceholderText("Názov firmy"), { target: { value: "Phase5 Customer Updated" } });
    fireEvent.change(screen.getByPlaceholderText("Potenciál €"), { target: { value: "450000" } });
    fireEvent.click(screen.getByRole("button", { name: "Uložiť" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Phase5 Customer Updated" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Nový kontakt" }));
    fireEvent.change(screen.getByPlaceholderText("Meno"), { target: { value: "Nový" } });
    fireEvent.change(screen.getByPlaceholderText("Priezvisko"), { target: { value: "Kontakt" } });
    fireEvent.change(screen.getByPlaceholderText("Pozícia"), { target: { value: "Nákup" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "novy.kontakt@example.test" } });
    fireEvent.change(screen.getByPlaceholderText("Telefón"), { target: { value: "0900999888" } });
    fireEvent.click(screen.getByRole("button", { name: "Uložiť kontakt" }));

    expect(await screen.findByText("Nový Kontakt")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith(
      "/customers/customer-1/contacts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("switches between visits and opportunities tabs", async () => {
    const customer = {
      id: "customer-1",
      name: "Phase5 Customer Tabs",
      segment: "vyroba",
      currentRevenue: "80000",
      annualRevenuePlan: "100000",
      annualRevenuePlanYear: new Date().getFullYear(),
      potential: "120000",
      shareOfWallet: null,
      strategicCategory: "A",
      createdAt: "2026-04-19T10:00:00.000Z",
    };
    const contacts = [];
    const visits = [
      {
        id: "visit-1",
        date: "2026-04-19",
        visitGoal: "Skontrolovať potreby",
        result: "Dohodnuté ďalšie stretnutie",
        nextStep: "Poslať návrh",
        nextStepDeadline: "2026-04-25",
        opportunityCreated: true,
        potentialEur: "15000",
        lateFlag: true,
      },
    ];
    const opportunities = [
      {
        id: "opp-1",
        title: "Phase5 Opportunity Detail",
        stage: "qualified",
        value: "42000",
        nextStepSummary: "Follow-up call",
        nextStepDeadline: "2026-05-02",
        stagnant: true,
      },
    ];

    apiMock.mockImplementation(async (path: string) => {
      if (path === "/customers/customer-1") return customer;
      if (path === "/customers/customer-1/contacts") return contacts;
      if (path === "/customers/customer-1/visits") return visits;
      if (path === "/customers/customer-1/opportunities") return opportunities;
      if (path === "/customers/customer-1/abra-revenues") {
        const currentYear = new Date().getFullYear();
        return [
          { id: "rev-1", year: currentYear, totalAmount: "40000", invoiceCount: 12 },
          { id: "rev-2", year: currentYear - 1, totalAmount: "72000", invoiceCount: 20 },
          { id: "rev-3", year: currentYear - 2, totalAmount: "68000", invoiceCount: 18 },
        ];
      }
      if (path === "/customers/customer-1/abra-quotes") return [];
      if (path === "/customers/customer-1/abra-orders") return [];
      throw new Error(`Unhandled api call: ${path}`);
    });

    renderCustomerDetail();

    expect(await screen.findByRole("heading", { name: "Phase5 Customer Tabs" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Návštevy" }));
    expect(await screen.findByRole("link", { name: "2026-04-19" })).toHaveAttribute("href", "/visits/visit-1");
    expect(screen.getAllByText("Dohodnuté ďalšie stretnutie").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Príležitosti" }));
    expect(await screen.findByRole("link", { name: "Phase5 Opportunity Detail" })).toBeInTheDocument();
    expect(screen.getByText(/stagnuje/)).toBeInTheDocument();

    expect(screen.getByText(`Tržby ${new Date().getFullYear()}`)).toBeInTheDocument();
    expect(screen.getByText("Plán sa plní")).toBeInTheDocument();
  });
});