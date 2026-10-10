"use client";

import { useState } from "react";

import type { Subscription } from "@/lib/subscription-metrics";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { SubscriptionFormDialog } from "@/components/dashboard/subscription-form-dialog";
import { SubscriptionTable } from "@/components/dashboard/subscription-table";
import { ErrorState, TableSkeleton } from "@/components/dashboard/states";
import { useSubscriptions } from "@/components/dashboard/use-subscriptions";

export default function SubscriptionsPage() {
  const {
    subscriptions,
    isPending,
    error,
    refetch,
  } = useSubscriptions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (subscription: Subscription) => {
    setEditing(subscription);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Subscriptions"
        description="Every subscription you track, with its renewals and recurring cost."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add subscription
          </Button>
        }
      />

      {error ? (
        <ErrorState
          description={error.message || "Could not load your subscriptions."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <TableSkeleton rows={8} />
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          onEdit={openEdit}
          onAdd={openCreate}
        />
      )}

      <SubscriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subscription={editing}
      />
    </div>
  );
}
