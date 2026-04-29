import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsPage } from "../../apps/web/src/pages/VisitsPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

const customers = Array.from({ length: 140 }, (_value, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name: `Zákazník ${String(index + 1).padStart(3, "0")}`,
}));

const selectedCustomer = customers[117];
const selectedContact = {
  id: "10000000-0000-4000-8000-000000000001",
  customerId: selectedCustomer.id,
  firstName: "Ján",
  lastName: "Vybraný",
};

describe("VisitsPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: "sales-1", name: "Obchodník", email: "sales@example.test", role: "sales" },
      loading: false,
    });
    apiMock.mockImplementation((path: string, options?: { method?: string; body?: string }) => {
      if (path === "/customers") {
        return Promise.resolve(customers);
      }

      if (path === "/customers?scope=all") {
        return Promise.resolve(customers);
      }

      if (path === "/visits" && options?.method === "POST") {
        return Promise.resolve({ id: "visit-1" });
      }

      if (path === "/visits") {
        return Promise.resolve([
          {
            id: "visit-row-1",
            date: "2026-04-25",
            customerId: selectedCustomer.id,
            contactId: selectedContact.id,
            visitGoal: "Prejsť servisný plán",
            result: "Dohodnutý follow-up",
            customerNeed: "Rýchlejšia reakcia",
            notes: "Treba preveriť cenu servisu a SLA.",
            opportunityType: "service",
            potentialEur: "4500",
            competition: "Lokálny partner",
            nextStep: "Poslať návrh",
            nextStepDeadline: "2026-04-30",
            lateFlag: false,
          },
        ]);
      }

      if (path === "/visits?scope=all") {
        return Promise.resolve([]);
      }

      if (path === `/customers/${selectedCustomer.id}/contacts`) {
        return Promise.resolve([selectedContact]);
      }

      return Promise.resolve([]);
    });
  });

  it("filters customers in the visit form and loads contacts for the selected customer", async () => {
    renderWithProviders(<VisitsPage />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/customers"));

    fireEvent.click(screen.getByRole("button", { name: "+ Nová návšteva" }));

    fireEvent.change(screen.getByRole("searchbox", { name: "Filtrovať zákazníkov vo formulári návštevy" }), { target: { value: "118" } });

    const customerSelect = screen.getByRole("combobox", { name: "Zákazník pre návštevu" });
    fireEvent.change(customerSelect, { target: { value: selectedCustomer.id } });

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(`/customers/${selectedCustomer.id}/contacts`));

    const form = screen.getByRole("button", { name: "Uložiť návštevu" }).closest("form");

    expect(form).not.toBeNull();

    const scoped = within(form!);
    expect(scoped.getByRole("option", { name: "Ján Vybraný" })).toBeInTheDocument();
    expect(scoped.getByRole("button", { name: "Diktovať poznámku" })).toBeInTheDocument();
  });

  it("shows visits as openable rows with notes preview", async () => {
    renderWithProviders(<VisitsPage />);

    expect(await screen.findByRole("link", { name: "2026-04-25" })).toHaveAttribute("href", "/visits/visit-row-1");
    expect(screen.getByText("Treba preveriť cenu servisu a SLA.")).toBeInTheDocument();
  });

  it("lets a salesperson switch the visits view to all salespeople", async () => {
    renderWithProviders(<VisitsPage />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/visits"));

    fireEvent.click(screen.getByRole("button", { name: "Všetky návštevy" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/visits?scope=all");
      expect(apiMock).toHaveBeenCalledWith("/customers?scope=all");
    });
  });
});