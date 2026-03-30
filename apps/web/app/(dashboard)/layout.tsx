"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Builder/canvas pages use full-width layout (no padding, no max-width)
  const isBuilderPage =
    pathname === "/agents/new" ||
    pathname === "/workflows/new" ||
    (pathname.startsWith("/agents/") &&
      !pathname.endsWith("/versions") &&
      pathname.split("/").length === 3) ||
    (pathname.startsWith("/workflows/") &&
      !pathname.includes("/runs") &&
      pathname.split("/").length === 3);

  return (
    <div className="flex min-h-screen bg-warmWhite">
      <Sidebar />
      <div className="flex flex-1 flex-col rounded-l-xl">
        {!isBuilderPage && <Header />}
        <main className="flex-1">
          {isBuilderPage ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-[1200px] px-6 py-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
