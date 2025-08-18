import { LayoutGrid, Users, Settings, CreditCard } from "lucide-react";

export const mainNav = [
  { href: "/dashboard", label: "Quadro de tarefas", icon: LayoutGrid },
  { href: "/members", label: "Membros", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/billing", label: "Planos", icon: CreditCard },
] as const;

export type NavItem = (typeof mainNav)[number];
