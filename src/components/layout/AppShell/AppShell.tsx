import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header/Header";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { Footer } from "@/components/layout/Footer/Footer";
import { MessageNotificationProvider } from "@/components/messages/MessageNotificationIndicator/MessageNotificationIndicator";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MessageNotificationProvider>
      <div className="market-shell">
        <a href="#main-content" className="market-skip-link">Pular para o conteúdo</a>
        <Header />
        <div className="market-frame">
          <Sidebar />
          <div className="market-content">
            <main id="main-content" tabIndex={-1}>{children}</main>
            <div className="market-footer"><Footer /></div>
          </div>
        </div>
      </div>
    </MessageNotificationProvider>
  );
}
