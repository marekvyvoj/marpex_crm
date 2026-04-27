import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../06_IMPLEMENTATION/apps/web/src/pages/LoginPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../06_IMPLEMENTATION/apps/web/src/components/AuthProvider.tsx", () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("LoginPage", () => {
  it("submits credentials and navigates to dashboard on success", async () => {
    loginMock.mockResolvedValueOnce(undefined);
    renderWithProviders(<LoginPage />, { route: "/login" });

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "manager@marpex.sk" } });
    fireEvent.change(screen.getByPlaceholderText("Heslo"), { target: { value: "manager123" } });
    fireEvent.click(screen.getByRole("button", { name: "Prihlásiť sa" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("manager@marpex.sk", "manager123");
      expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message when login fails", async () => {
    loginMock.mockRejectedValueOnce(new Error("Príliš veľa pokusov. Skúste znova o 15 minút."));
    renderWithProviders(<LoginPage />, { route: "/login" });

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "manager@marpex.sk" } });
    fireEvent.change(screen.getByPlaceholderText("Heslo"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Prihlásiť sa" }));

    expect(await screen.findByText("Príliš veľa pokusov. Skúste znova o 15 minút.")).toBeInTheDocument();
  });

  it("shows a dedicated message for network failures", async () => {
    loginMock.mockRejectedValueOnce(new Error("Failed to fetch"));
    renderWithProviders(<LoginPage />, { route: "/login" });

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "manager@marpex.sk" } });
    fireEvent.change(screen.getByPlaceholderText("Heslo"), { target: { value: "manager123" } });
    fireEvent.click(screen.getByRole("button", { name: "Prihlásiť sa" }));

    expect(await screen.findByText("Prihlásenie zlyhalo. Skontrolujte pripojenie alebo nastavenie API.")).toBeInTheDocument();
  });
});