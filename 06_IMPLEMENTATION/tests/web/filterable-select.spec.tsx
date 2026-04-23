import React, { useState } from "react";
import "./setup.ts";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterableSelect } from "../../apps/web/src/components/FilterableSelect.tsx";
import { renderWithProviders } from "./helpers/render.tsx";

const options = Array.from({ length: 120 }, (_value, index) => ({
  value: `customer-${index + 1}`,
  label: `Zákazník ${String(index + 1).padStart(3, "0")}`,
}));

function Harness() {
  const [value, setValue] = useState("");

  return (
    <>
      <FilterableSelect
        options={options}
        value={value}
        onChange={setValue}
        emptyOptionLabel="Vybrať zákazníka"
        searchLabel="Filtrovať zákazníkov"
        selectAriaLabel="Výber zákazníka"
      />
      <div data-testid="selected-value">{value}</div>
    </>
  );
}

describe("FilterableSelect", () => {
  it("filters a large option list and clears the search after selection", () => {
    renderWithProviders(<Harness />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Filtrovať zákazníkov" }), { target: { value: "118" } });

    expect(screen.getByText("Zobrazených 1 z 120 možností.")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Zákazník 001" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Výber zákazníka" }), { target: { value: "customer-118" } });

    expect(screen.getByTestId("selected-value")).toHaveTextContent("customer-118");
    expect(screen.getByRole("searchbox", { name: "Filtrovať zákazníkov" })).toHaveValue("");
  });

  it("keeps the selected option visible while a different filter is active", () => {
    renderWithProviders(<Harness />);

    fireEvent.change(screen.getByRole("combobox", { name: "Výber zákazníka" }), { target: { value: "customer-25" } });
    fireEvent.change(screen.getByRole("searchbox", { name: "Filtrovať zákazníkov" }), { target: { value: "118" } });

    expect(screen.getByRole("option", { name: "Zákazník 025" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Zákazník 118" })).toBeInTheDocument();
  });
});