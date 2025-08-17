import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Product Roadmap", "Marketing", "Design System", "Novo Board"].map(
          (title, i) => (
            <Card key={i} className="p-4">
              <div className="font-medium">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {title === "Novo Board"
                  ? "Crie seu primeiro board"
                  : "Ativo • atualizado hoje"}
              </p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
