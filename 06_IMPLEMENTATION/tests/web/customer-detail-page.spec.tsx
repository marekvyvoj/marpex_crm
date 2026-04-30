import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { CustomerDetailPage } from "../../apps/web/src/pages/CustomerDetailPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => useAuthMock(),
}));

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
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: "sales-1", name: "Obchodník", email: "sales@example.test", role: "sales" },
      loading: false,
    });
  });

  it("updates customer header data and creates a contact", async () => {
    let customer = {
      id: "customer-1",
      name: "Phase5 Customer Detail",
      segment: "integrator",
      industry: "oem",
      ico: "44556677",
      dic: "2023001122",
      icDph: "SK2023001122",
      address: "Priemyselná 12",
      city: "Nitra",
      postalCode: "949 01",
      district: "Nitra",
      region: "Nitriansky",
      currentRevenue: "120000",
      annualRevenuePlan: "180000",
      annualRevenuePlanYear: new Date().getFullYear(),
      shareOfWallet: 35,
      ownerId: "sales-1",
      ownerName: "Rastislav Bušík",
      resolverIds: ["sales-2"],
      resolverNames: ["Patrik Bača"],
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
          };
        }
        return customer;
      }

      if (path === "/users/sales-options") {
        return [
          { id: "sales-1", name: "Rastislav Bušík", role: "sales", active: true },
          { id: "sales-2", name: "Patrik Bača", role: "sales", active: true },
          { id: "sales-3", name: "Dušan Gabriška", role: "sales", active: true },
        ];
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
    expect(screen.getByText(/Odvetvie:/)).toHaveTextContent("OEM");
    expect(screen.getByText(/Segment:/)).toHaveTextContent("integrator");
    expect(screen.getByText(/Vlastník:/)).toHaveTextContent("Rastislav Bušík");
    expect(screen.getByText(/Riešitelia:/)).toHaveTextContent("Patrik Bača");
    expect(screen.getByText(/IČO:/)).toHaveTextContent("44556677");
    expect(screen.getByText(/DIČ:/)).toHaveTextContent("2023001122");
    expect(screen.getByText(/IČ DPH:/)).toHaveTextContent("SK2023001122");
    expect(screen.getByText(/Mesto:/)).toHaveTextContent("Nitra");
    expect(screen.getByText(/Kraj:/)).toHaveTextContent("Nitriansky");

    fireEvent.click(screen.getByRole("button", { name: "Upraviť" }));
    await screen.findByRole("option", { name: "Patrik Bača" });
    fireEvent.change(screen.getByPlaceholderText("Názov firmy"), { target: { value: "Phase5 Customer Updated" } });
    fireEvent.change(screen.getByPlaceholderText(`Plán tržieb ${new Date().getFullYear()} €`), { target: { value: "450000" } });
    fireEvent.change(screen.getByLabelText("Vlastník zákazníka"), { target: { value: "sales-2" } });
    fireEvent.click(screen.getByLabelText("Dušan Gabriška"));
    fireEvent.click(screen.getByRole("button", { name: "Uložiť" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Phase5 Customer Updated" })).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(`Plán ${new Date().getFullYear()}:`))).toHaveTextContent("€ 450 000");
    expect(apiMock).toHaveBeenCalledWith(
      "/customers/customer-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"ownerId":"sales-2"'),
      }),
    );

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
      industry: "potravinarstvo",
      ico: "88990011",
      dic: "2022112233",
      icDph: "SK2022112233",
      address: "Potravinárska 5",
      city: "Trenčín",
      postalCode: "911 01",
      district: "Trenčín",
      region: "Trenčiansky",
      currentRevenue: "80000",
      annualRevenuePlan: "100000",
      annualRevenuePlanYear: new Date().getFullYear(),
      shareOfWallet: null,
      ownerId: null,
      ownerName: null,
      resolverIds: [],
      resolverNames: [],
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
      if (path === "/users/sales-options") return [];
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