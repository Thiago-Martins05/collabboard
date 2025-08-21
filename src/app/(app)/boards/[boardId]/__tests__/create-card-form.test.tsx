import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../actions", () => ({
  createCard: vi.fn(async () => ({ ok: true })),
}));

import { createCard } from "../actions";
import { CreateCardForm } from "../create-card-form";

describe("CreateCardForm", () => {
  it("envia a server action ao submeter", async () => {
    render(<CreateCardForm columnId="col-123" boardId="board-123" />);

    const input = screen.getByLabelText(/título/i);
    fireEvent.change(input, { target: { value: "Implementar API" } });

    const btn = screen.getByRole("button", { name: /adicionar card/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(createCard).toHaveBeenCalledTimes(1);
    });
  });

  it("mostra erro de validação se vazio", async () => {
    render(<CreateCardForm columnId="col-123" boardId="board-123" />);
    const btn = screen.getByRole("button", { name: /adicionar card/i });
    fireEvent.click(btn);

    expect(await screen.findByText(/informe o título/i)).toBeInTheDocument();
  });
});
