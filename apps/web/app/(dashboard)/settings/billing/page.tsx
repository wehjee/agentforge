"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { name: "Agents", free: "3", pro: "25", team: "Unlimited", enterprise: "Unlimited" },
  { name: "Conversations / mo", free: "500", pro: "10,000", team: "100,000", enterprise: "Unlimited" },
  { name: "Token budget / mo", free: "$10", pro: "$200", team: "$2,000", enterprise: "Custom" },
  { name: "Knowledge bases", free: "1", pro: "10", team: "50", enterprise: "Unlimited" },
  { name: "Team members", free: "1", pro: "5", team: "25", enterprise: "Unlimited" },
  { name: "Workflows", free: false, pro: "10", team: "Unlimited", enterprise: "Unlimited" },
  { name: "Custom tools", free: false, pro: true, team: true, enterprise: true },
  { name: "API access", free: false, pro: true, team: true, enterprise: true },
  { name: "Slack integration", free: false, pro: true, team: true, enterprise: true },
  { name: "SSO / SAML", free: false, pro: false, team: true, enterprise: true },
  { name: "Audit log", free: false, pro: false, team: true, enterprise: true },
  { name: "Priority support", free: false, pro: false, team: true, enterprise: true },
  { name: "Custom SLA", free: false, pro: false, team: false, enterprise: true },
  { name: "Dedicated infra", free: false, pro: false, team: false, enterprise: true },
];

const PLANS = [
  { key: "free", name: "Free", price: "$0", period: "/mo", description: "Get started with AI agents" },
  { key: "pro", name: "Pro", price: "$49", period: "/mo", description: "For growing teams" },
  { key: "team", name: "Team", price: "$199", period: "/mo", description: "For organizations at scale" },
  { key: "enterprise", name: "Enterprise", price: "Custom", period: "", description: "Tailored for your needs" },
];

function UsageMeter({
  label,
  current,
  max,
  unit,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
}) {
  const percentage = Math.min((current / max) * 100, 100);
  const isHigh = percentage > 80;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-slate-600">{label}</span>
        <span className="text-[13px] text-slate-400">
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${
            isHigh ? "bg-amber-500" : "bg-sage-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-[13px] text-slate-700">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-sage-500" />
  ) : (
    <span className="mx-auto block h-4 text-center text-slate-200">&mdash;</span>
  );
}

export default function BillingPage() {
  const currentPlan = "free";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
          Billing & Usage
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Manage your subscription and monitor resource usage.
        </p>
      </div>

      {/* Current plan */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <CreditCard className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-slate-900">
                  Free Plan
                </h3>
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[11px]">
                  Current
                </Badge>
              </div>
              <p className="mt-0.5 text-[13px] text-slate-400">
                You are on the free tier. Upgrade to unlock more agents and features.
              </p>
            </div>
          </div>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-slate-900">
            Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageMeter label="Agents" current={2} max={3} unit="" />
          <UsageMeter label="Conversations" current={342} max={500} unit="this month" />
          <UsageMeter label="Token budget" current={6.2} max={10} unit="USD" />
          <UsageMeter label="Knowledge bases" current={1} max={1} unit="" />
          <UsageMeter label="Team members" current={1} max={1} unit="" />
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 className="mb-4 text-[18px] font-semibold text-slate-900">
          Compare Plans
        </h2>

        {/* Plan cards (mobile-friendly) */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            return (
              <Card
                key={plan.key}
                className={`rounded-xl shadow-card transition-shadow hover:shadow-card-hover ${
                  isCurrent
                    ? "border-sage-100 ring-1 ring-sage-50"
                    : "border-slate-100"
                }`}
              >
                <CardContent className="p-5">
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-[28px] font-bold tracking-tight text-slate-900">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-[13px] text-slate-400">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-slate-400">
                    {plan.description}
                  </p>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    size="sm"
                    className="mt-4 w-full"
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <Card className="rounded-xl border-slate-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-slate-400">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.key}
                      className={`px-5 py-3 text-center text-[12px] font-medium uppercase tracking-wider ${
                        plan.key === currentPlan
                          ? "text-sage-600"
                          : "text-slate-400"
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((feature) => (
                  <tr
                    key={feature.name}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-5 py-3 text-[13px] text-slate-700">
                      {feature.name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <FeatureCell value={feature.free} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <FeatureCell value={feature.pro} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <FeatureCell value={feature.team} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <FeatureCell value={feature.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
