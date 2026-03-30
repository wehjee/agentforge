"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-warmWhite px-6">
      <Breadcrumbs />
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-[11px] font-medium text-slate-200">
            AU
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
