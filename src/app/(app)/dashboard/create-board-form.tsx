"use client";

import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBoardSchema, CreateBoardInput } from "./schema";
import { createBoard } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";
import { Separator } from "@radix-ui/react-select";

export function CreateBoardForm() {
  const [state, formAction] = useFormState(createBoard, { ok: false });

  const form = useForm<CreateBoardInput>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: { title: "" },
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    formAction(data);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 ">
      <div className="space-y-2 flex flex-col gap-5">
        <Label htmlFor="title">Nome da Tarefa</Label>
        <Input
          id="title"
          type="text"
          placeholder="Digite o nome da tarefa.."
          className=" flex "
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Separator />
      <Button type="submit" className="">
        Criar tarefa
      </Button>
    </form>
  );
}
