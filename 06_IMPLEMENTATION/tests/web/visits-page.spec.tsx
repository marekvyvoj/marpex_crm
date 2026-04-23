import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsPage } from "../../apps/web/src/pages/VisitsPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

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
    apiMock.mockImplementation((path: string, options?: { method?: string; body?: string }) => {
      if (path === "/customers") {
        return Promise.resolve(customers);
      }

      if (path === "/visits" && options?.method === "POST") {
        return Promise.resolve({ id: "visit-1" });
      }

      if (path === "/visits") {
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
  });
});