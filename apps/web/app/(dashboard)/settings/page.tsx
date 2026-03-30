"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Key,
  Users,
  Shield,
  CreditCard,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const settingsNav = [
  {
    href: "/settings",
    label: "General",
    description: "Workspace name, slug, and plan",
    icon: Building2,
    active: true,
  },
  {
    href: "/settings/api-keys",
    label: "API Keys",
    description: "Manage API keys for external access",
    icon: Key,
  },
  {
    href: "#",
    label: "Team",
    description: "Manage members and roles",
    icon: Users,
    soon: true,
  },
  {
    href: "#",
    label: "Security",
    description: "Authentication and access controls",
    icon: Shield,
    soon: true,
  },
  {
    href: "#",
    label: "Billing",
    description: "Plan, usage, and invoices",
    icon: CreditCard,
    soon: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[20px] font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-[13px] text-slate-400">
          Manage your workspace settings and integrations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.soon ? "#" : item.href}
              className={cn(
                "group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all",
                item.soon
                  ? "cursor-default opacity-50"
                  : "hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-slate-200/70">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-slate-900">
                {item.label}
              </h3>
              <p className="mt-1 text-[13px] text-slate-400">
                {item.description}
              </p>
              {item.soon && (
                <span className="mt-2 inline-block w-fit rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
                  Coming soon
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* General Settings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-[16px] font-semibold text-slate-900">
          Workspace Information
        </h2>
        <p className="mt-1 text-[13px] text-slate-400">
          Basic information about your workspace
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="text-[13px] font-medium text-slate-700">
              Workspace Name
            </label>
            <div className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[14px] text-slate-600">
              My Workspace
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-slate-700">
              Plan
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[14px] text-slate-600">
              Free
              <span className="rounded bg-sage-50 px-1.5 py-0.5 text-[11px] font-medium text-sage-600">
                Current
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
