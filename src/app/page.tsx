import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-dvh p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">CollabBoard</h1>
        <ThemeToggle />
      </header>

      <section className="grid place-items-center">
        <div className="rounded-2xl border bg-card text-card-foreground p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Tema funcionando ✅</h2>
          <div className="flex gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
