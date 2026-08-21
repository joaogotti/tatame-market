import Link from "next/link";
import { Suspense } from "react";
import {
  House,
  Tag,
  LayoutGrid,
  Heart,
  MessageCircle,
  User,
} from "lucide-react";

import { MessageNotificationIndicator } from "@/components/messages/MessageNotificationIndicator/MessageNotificationIndicator";

const navigation = [
  {
    label: "Início",
    href: "/",
    icon: House,
  },
  {
    label: "Anúncios",
    href: "/anuncios",
    icon: Tag,
  },
  {
    label: "Categorias",
    href: "/categorias",
    icon: LayoutGrid,
  },
  {
    label: "Favoritos",
    href: "/favoritos",
    icon: Heart,
  },
  {
    label: "Mensagens",
    href: "/mensagens",
    icon: MessageCircle,
  },
  {
    label: "Meus anúncios",
    href: "/meus-anuncios",
    icon: User,
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-[#111412] p-4">
      <nav className="flex flex-col gap-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-[#A7AAA8] transition hover:bg-[#181B19] hover:text-[#F5F5F5]"
            >
              <Icon size={20} />

              <span>{item.label}</span>

              {item.href === "/mensagens" && (
                <Suspense fallback={null}>
                  <MessageNotificationIndicator />
                </Suspense>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
