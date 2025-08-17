import { LayoutGrid, Users, Settings, CreditCard } from "lucide-react";

export const mainNav = [
  { href: "/dashboard", label: "Boards", icon: LayoutGrid },
  { href: "/members", label: "Membros", icon: Users },
  { href: "/settings", label: "Config", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
] as const;

export type NavItem = (typeof mainNav)[number];
