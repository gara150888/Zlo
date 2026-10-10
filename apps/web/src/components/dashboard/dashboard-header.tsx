"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DashboardHeaderProps = {
  onAdd: () => void;
};

export function DashboardHeader({ onAdd }: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your recurring expenses and upcoming renewals.
        </p>
      </div>
      <Button onClick={onAdd}>
        <PlusIcon />
        Add subscription
      </Button>
    </div>
  );
}
