import React from "react";
import "./setup.ts";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportPage } from "../../apps/web/src/pages/ImportPage.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const apiMock = vi.fn();

vi.mock("../../apps/web/src/lib/api.ts", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("ImportPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("loads sample CSV, previews rows and shows import summary", async () => {
    apiMock.mockResolvedValueOnce({
      jobId: "job-1",
      total: 2,
      imported: 2,
      errors: 0,
    });

    renderWithProviders(<ImportPage />);

    fireEvent.click(screen.getByRole("button", { name: "Načítať príklad" }));
    expect(screen.getByText("Firma ABC s.r.o.")).toBeInTheDocument();
    expect(screen.getByText("Beta Systémy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Spustiť import" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/import/customers",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "text/csv" },
        }),
      );
    });

    expect(await screen.findByText("Výsledok importu")).toBeInTheDocument();
    expect(screen.getByText(/Importovaných:/)).toHaveTextContent("2");
  });

  it("shows API error when import fails", async () => {
    apiMock.mockRejectedValueOnce(new Error("CSV chyba"));

    renderWithProviders(<ImportPage />);

    fireEvent.change(screen.getByPlaceholderText("Vložte CSV obsah sem…"), {
      target: {
        value: "name,segment\nPhase5 Broken,invalid",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Spustiť import" }));

    expect(await screen.findByText("CSV chyba")).toBeInTheDocument();
  });
});