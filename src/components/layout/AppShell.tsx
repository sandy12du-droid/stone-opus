import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { RightRail } from "./RightRail";
import { ContextBreadcrumbs } from "./ContextBreadcrumbs";
import { CommandPalette } from "@/components/CommandPalette";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppShell({ children, title, subtitle, actions }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-canvas text-foreground">
      <CommandPalette />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <ContextBreadcrumbs />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] px-8 py-8">
              {(title || actions) && (
                <header className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    {title && (
                      <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    )}
                  </div>
                  {actions && <div className="flex items-center gap-2">{actions}</div>}
                </header>
              )}
              {children}
            </div>
          </main>
          <RightRail />
        </div>
      </div>
    </div>
  );
}

