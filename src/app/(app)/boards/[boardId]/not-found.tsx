import Link from "next/link";

export default function NotFoundBoard() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Board não encontrado</h1>
      <p className="text-sm text-muted-foreground">
        Verifique o link ou volte ao dashboard.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
