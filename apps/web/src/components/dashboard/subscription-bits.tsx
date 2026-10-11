"use client";

import { cn } from "@/lib/utils";
import { statusLabels, statusTones, type StatusTone } from "@/lib/subscription-labels";
import { categoryLabels } from "@/lib/subscription-labels";
import type {
  SubscriptionCategory,
  SubscriptionStatus,
} from "@Zlo/zod/subscription";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Subscription } from "@/lib/subscription-metrics";

export function ProviderAvatar({
  subscription,
  className,
}: {
  subscription: Pick<Subscription, "name" | "provider" | "logoUrl">;
  className?: string;
}) {
  const label = subscription.provider?.trim() || subscription.name;
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <Avatar className={cn("size-7 rounded-md", className)}>
      {subscription.logoUrl ? (
        <AvatarImage className="object-contain p-[0.15rem]" src={subscription.logoUrl} alt="" />
      ) : null}
      <AvatarFallback className="rounded-md bg-muted text-[0.625rem] font-medium text-muted-foreground">
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[statusTones[status]],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function CategoryTag({ category }: { category: SubscriptionCategory }) {
  return (
    <span className="text-sm text-muted-foreground">{categoryLabels[category]}</span>
  );
}
