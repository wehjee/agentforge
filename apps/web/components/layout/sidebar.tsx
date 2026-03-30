"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  BookOpen,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: LayoutGrid },
];

const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("workspaceId");
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-500">
            <span className="text-[11px] font-bold text-white">AF</span>
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold text-white">
              AgentForge
            </span>
          )}
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-fast",
                isActive
                  ? "bg-white/[0.07] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sage-500" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 px-2 pb-3">
        <Separator className="mb-3 bg-white/[0.06]" />
        {bottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors duration-fast",
                "hover:bg-white/[0.04] hover:text-slate-300"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}

        {/* User */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-[11px] text-slate-200">
              AU
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <span className="text-[13px] text-slate-400">Admin</span>
              <button
                onClick={handleSignOut}
                className="text-slate-500 transition-colors hover:text-slate-300"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="hidden border-t border-white/[0.06] p-3 text-slate-500 transition-colors hover:text-slate-300 lg:block"
      >
        {collapsed ? (
          <ChevronRight className="mx-auto h-4 w-4" />
        ) : (
          <ChevronLeft className="mx-auto h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen transition-[width] duration-normal ease-sprout-out lg:block",
          collapsed ? "w-16" : "w-[260px]"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-3 top-3 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <SidebarContent collapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Spacer */}
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-normal ease-sprout-out lg:block",
          collapsed ? "w-16" : "w-[260px]"
        )}
      />
    </>
  );
}
