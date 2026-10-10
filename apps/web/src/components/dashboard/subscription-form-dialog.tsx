"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import {
  billingIntervals,
  currencyLabels,
  currencyOptions,
  defaultFormValues,
  formatMajorAmount,
  subscriptionCategories,
  subscriptionFormSchema,
  subscriptionStatuses,
  toSubscriptionInput,
  type SubscriptionFormValues,
} from "@/lib/subscription-form";
import { billingIntervalLabels, categoryLabels, statusLabels } from "@/lib/subscription-labels";
import type { Subscription } from "@/lib/subscription-metrics";
import type {
  BillingInterval,
  SubscriptionCategory,
  SubscriptionStatus,
} from "@Zlo/zod/subscription";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LogoField } from "./logo-field";
import { useSubscriptionMutations } from "./use-subscriptions";

function formValuesFromSubscription(
  subscription: Subscription,
): SubscriptionFormValues {
  return {
    name: subscription.name,
    provider: subscription.provider ?? "",
    logoUrl: subscription.logoUrl ?? "",
    amount: formatMajorAmount(subscription.amountMinor, subscription.currency),
    currency: subscription.currency,
    interval: subscription.interval,
    intervalCount: String(subscription.intervalCount),
    startDate: subscription.startDate,
    nextBillingDate: subscription.nextBillingDate ?? "",
    trialEndDate: subscription.trialEndDate ?? "",
    category: subscription.category,
    status: subscription.status,
    notes: subscription.notes ?? "",
  };
}

export type SubscriptionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
};

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
}: SubscriptionFormDialogProps) {
  const { createSubscription, updateSubscription } = useSubscriptionMutations();
  const isEditing = Boolean(subscription);

  const form = useForm({
    defaultValues: subscription
      ? formValuesFromSubscription(subscription)
      : defaultFormValues,
    validators: {
      onSubmit: subscriptionFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = subscriptionFormSchema.safeParse(value);
      if (!parsed.success) {
        toast.error("Please fix the highlighted fields.");
        return;
      }
      const input = toSubscriptionInput(value);
      try {
        if (subscription) {
          await updateSubscription.mutateAsync({ ...input, id: subscription.id });
          toast.success("Subscription updated");
        } else {
          await createSubscription.mutateAsync(input);
          toast.success("Subscription added");
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save the subscription.",
        );
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        subscription
          ? formValuesFromSubscription(subscription)
          : defaultFormValues,
      );
    }
  }, [open, subscription, form]);

  const isSaving = createSubscription.isPending || updateSubscription.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this subscription. Changes apply to future renewals."
              : "Track a recurring expense you pay for elsewhere. Zlo never charges you for it."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >

          <form.Field name="name">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Netflix"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="provider">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Provider</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Netflix, Inc."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="logoUrl">
            {(field) => (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="logoUrl">Logo</Label>
                <LogoField
                  value={field.state.value}
                  onChange={field.handleChange}
                  onProviderChange={(name) =>
                    form.setFieldValue("provider", name)
                  }
                  fallbackText={
                    form.getFieldValue("name") || form.getFieldValue("provider")
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Search the logo library to fill the provider automatically,
                  upload your own image, or paste a link.
                </p>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="amount">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Amount</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="9.99"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="currency">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Currency</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) field.handleChange(value);
                  }}
                >
                  <SelectTrigger id={field.name} aria-label="Currency">
                    <SelectValue>
                      {(value) => currencyLabels[value ?? ""] ?? value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.code} — {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="interval">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Billing interval</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) field.handleChange(value);
                  }}
                >
                  <SelectTrigger id={field.name} aria-label="Billing interval">
                    <SelectValue>
                      {(value) =>
                        billingIntervalLabels[value as BillingInterval] ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {billingIntervals.map((interval) => (
                      <SelectItem key={interval} value={interval}>
                        {billingIntervalLabels[interval]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="intervalCount">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Repeats every</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of {field.state.value === "1" ? "interval" : "intervals"} between charges.
                </p>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="startDate">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Start date</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="nextBillingDate">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Next billing date</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="category">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) field.handleChange(value);
                  }}
                >
                  <SelectTrigger id={field.name} aria-label="Category">
                    <SelectValue>
                      {(value) =>
                        categoryLabels[value as SubscriptionCategory] ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabels[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Status</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) field.handleChange(value);
                  }}
                >
                  <SelectTrigger id={field.name} aria-label="Status">
                    <SelectValue>
                      {(value) =>
                        statusLabels[value as SubscriptionStatus] ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="trialEndDate">
            {(field) => (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor={field.name}>Trial end date</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder="Shared with family, renews after the annual plan."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldErrors({
  errors,
}: {
  errors: ReadonlyArray<{ message: string } | undefined> | undefined;
}) {
  if (!errors || errors.length === 0) return null;
  return (
    <>
      {errors.map((error, index) =>
        error ? (
          <p key={error.message ?? index} className="text-xs text-destructive">
            {error.message}
          </p>
        ) : null,
      )}
    </>
  );
}
