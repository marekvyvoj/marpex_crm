import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersPage } from "../../apps/web/src/pages/UsersPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();
let authUser: { id: string; role: "manager" | "sales" } | null = { id: "manager-1", role: "manager" };

vi.mock("../../apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("UsersPage", () => {
  beforeEach(() => {
    authUser = { id: "manager-1", role: "manager" };
    apiMock.mockReset();
  });

  it("blocks sales users from manager-only page", () => {
    authUser = { id: "sales-1", role: "sales" };
    apiMock.mockResolvedValue([]);

    renderWithProviders(<UsersPage />);

    expect(screen.getByText("Prístup zamietnutý — len manažér.")).toBeInTheDocument();
  });

  it("creates, promotes and deactivates users", async () => {
    let usersState = [
      {
        id: "manager-1",
        name: "Manager",
        email: "manager@marpex.sk",
        role: "manager",
        active: true,
        createdAt: "2026-04-19T10:00:00.000Z",
      },
      {
        id: "sales-1",
        name: "Sales",
        email: "sales@example.test",
        role: "sales",
        active: true,
        createdAt: "2026-04-19T10:00:00.000Z",
      },
    ];

    apiMock.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
      if (path === "/users") {
        if (init?.method === "POST") {
          const body = JSON.parse(init.body ?? "{}");
          const created = {
            id: "user-3",
            name: body.name,
            email: body.email,
            role: body.role,
            active: true,
            createdAt: "2026-04-19T10:00:00.000Z",
          };
          usersState = [...usersState, created];
          return created;
        }
        return usersState;
      }

      if (path.startsWith("/users/")) {
        const id = path.split("/").pop()!;
        const body = JSON.parse(init?.body ?? "{}");
        usersState = usersState.map((user) => (user.id === id ? { ...user, ...body } : user));
        return usersState.find((user) => user.id === id);
      }

      throw new Error(`Unhandled api call: ${path}`);
    });

    renderWithProviders(<UsersPage />);

    expect(await screen.findByText("Správa používateľov")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Nový používateľ" }));
    const createForm = screen.getByRole("button", { name: "Vytvoriť" }).closest("form");
    expect(createForm).not.toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Meno a priezvisko"), { target: { value: "Phase5 Tester" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "phase5-tester@example.test" } });
    fireEvent.change(screen.getByPlaceholderText("Heslo (min. 8 znakov)"), { target: { value: "phase5pass" } });
    fireEvent.change(within(createForm!).getByRole("combobox"), { target: { value: "sales" } });
    fireEvent.click(screen.getByRole("button", { name: "Vytvoriť" }));

    expect(await screen.findByText("Phase5 Tester")).toBeInTheDocument();

    let createdRow = screen.getByText("Phase5 Tester").closest("tr");
    expect(createdRow).not.toBeNull();
    fireEvent.change(within(createdRow!).getByRole("combobox"), { target: { value: "manager" } });

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/users/user-3",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    createdRow = screen.getByText("Phase5 Tester").closest("tr");
    fireEvent.click(within(createdRow!).getByRole("button", { name: "Deaktivovať" }));

    await waitFor(() => {
      expect(screen.getByText("Neaktívny")).toBeInTheDocument();
    });
  });
});