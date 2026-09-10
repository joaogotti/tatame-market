"use client";

import { Heart, House, LayoutGrid, MessageCircle, Tag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/constants/navigation";
import { MessageNotificationIndicator } from "@/components/messages/MessageNotificationIndicator/MessageNotificationIndicator";

const icons = [House, Tag, LayoutGrid, Heart, MessageCircle, User];

export function Navigation({ variant }: { variant: "header" | "sidebar" }) {
  const pathname = usePathname();
  const items = variant === "header" ? navigation.slice(0, 5) : navigation;

  return (
    <nav aria-label={variant === "header" ? "Navegação principal" : "Navegação lateral"} className={`market-nav market-nav--${variant}`}>
      {items.map((item, index) => {
        const Icon = icons[index];
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="market-nav-link">
            {variant === "sidebar" && <Icon size={18} strokeWidth={1.7} aria-hidden="true" />}
            <span>{item.label}</span>
            {item.href === "/mensagens" && <MessageNotificationIndicator />}
          </Link>
        );
      })}
    </nav>
  );
}
