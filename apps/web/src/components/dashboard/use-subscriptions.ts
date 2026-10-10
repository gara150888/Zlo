"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import type { Subscription } from "@/lib/subscription-metrics";

/**
 * Shared subscription data access. All mutations invalidate the
 * subscription, dashboard and analytics query paths so every view stays
 * consistent without duplicate requests.
 */
export function useSubscriptions() {
  const query = useQuery(trpc.subscription.list.queryOptions());
  return {
    ...query,
    subscriptions: query.data as Subscription[] | undefined,
  };
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient();

  const invalidateSubscriptionData = () => {
    queryClient.invalidateQueries(trpc.subscription.pathFilter());
    queryClient.invalidateQueries(trpc.dashboard.pathFilter());
    queryClient.invalidateQueries(trpc.analytics.pathFilter());
  };

  const createSubscription = useMutation(
    trpc.subscription.create.mutationOptions({
      onSuccess: invalidateSubscriptionData,
    }),
  );

  const updateSubscription = useMutation(
    trpc.subscription.update.mutationOptions({
      onSuccess: invalidateSubscriptionData,
    }),
  );

  const deleteSubscription = useMutation(
    trpc.subscription.delete.mutationOptions({
      onSuccess: invalidateSubscriptionData,
    }),
  );

  const cancelSubscription = useMutation(
    trpc.subscription.cancel.mutationOptions({
      onSuccess: invalidateSubscriptionData,
    }),
  );

  const restoreSubscription = useMutation(
    trpc.subscription.restore.mutationOptions({
      onSuccess: invalidateSubscriptionData,
    }),
  );

  return {
    createSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    restoreSubscription,
  };
}
