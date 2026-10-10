"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  categoryLabels,
  formatBillingInterval,
  statusLabels,
} from "@/lib/subscription-labels";
import {
  formatCurrency,
  formatDate,
  formatRenewalLabel,
} from "@/lib/format";
import type { Subscription } from "@/lib/subscription-metrics";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryTag, ProviderAvatar, StatusBadge } from "./subscription-bits";
import { EmptyState, TableSkeleton } from "./states";
import { useSubscriptionMutations } from "./use-subscriptions";
import {
  subscriptionCategories,
  subscriptionStatuses,
} from "@/lib/subscription-form";

const PAGE_SIZE = 8;

const categoryFilterLabels: Record<string, string> = {
  all: "All categories",
  ...categoryLabels,
};

const statusFilterLabels: Record<string, string> = {
  all: "All statuses",
  ...statusLabels,
};

type SortKey = "name" | "amount" | "nextBillingDate" | "createdAt";
type SortDirection = "asc" | "desc";

const sortableColumns: {
  key: SortKey;
  label: string;
  className?: string;
}[] = [
    { key: "name", label: "Service" },
    { key: "amount", label: "Amount", className: "text-right" },
    {
      key: "nextBillingDate",
      label: "Next billing",
      className: "hidden sm:table-cell",
    },
    { key: "createdAt", label: "Added", className: "hidden lg:table-cell" },
  ];

export type SubscriptionTableProps = {
  subscriptions: Subscription[] | undefined;
  loading?: boolean;
  onEdit: (subscription: Subscription) => void;
  onAdd?: () => void;
  className?: string;
};

export function SubscriptionTable({ subscriptions, loading = false, onEdit, onAdd, className }: SubscriptionTableProps) {

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "nextBillingDate",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null);

  const { deleteSubscription, cancelSubscription, restoreSubscription } = useSubscriptionMutations();

  const rows = useMemo(() => subscriptions ?? [], [subscriptions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((subscription) => {
      if (category !== "all" && subscription.category !== category) return false;
      if (status !== "all" && subscription.status !== status) return false;
      if (!term) return true;
      return (
        subscription.name.toLowerCase().includes(term) ||
        (subscription.provider ?? "").toLowerCase().includes(term) ||
        (subscription.notes ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, search, category, status]);

  const sorted = useMemo(() => {
    const direction = sort.direction === "asc" ? 1 : -1;
    const value = (subscription: Subscription): string | number => {
      switch (sort.key) {
        case "amount":
          return subscription.amountMinor;
        case "createdAt":
          return subscription.createdAt;
        default:
          return subscription[sort.key] ?? "";
      }
    };
    return [...filtered].sort((a, b) => {
      const first = value(a);
      const second = value(b);
      if (first === second) return a.name.localeCompare(b.name);
      // Keep empty values (e.g. missing billing date) last in both directions.
      if (first === "") return 1;
      if (second === "") return -1;
      return (first < second ? -1 : 1) * direction;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const hasActiveFilters = search.trim() !== "" || category !== "all" || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const runMutation = async (
    mutation: "cancel" | "restore" | "delete",
    subscription: Subscription,
  ) => {

    const labels = {
      cancel: "Subscription cancelled",
      restore: "Subscription restored",
      delete: "Subscription deleted",
    };

    try {
      if (mutation === "cancel") {
        await cancelSubscription.mutateAsync({ id: subscription.id });
      } else if (mutation === "restore") {
        await restoreSubscription.mutateAsync({ id: subscription.id });
      } else {
        await deleteSubscription.mutateAsync({ id: subscription.id });
      }
      toast.success(labels[mutation]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed. Try again.",
      );
    }
  };

  if (loading) {
    return <TableSkeleton className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>
              {rows.length} tracked · {filtered.length} shown
            </CardDescription>
          </div>
          {onAdd ? (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <PlusIcon />
              Add
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-56 sm:flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search subscriptions"
              aria-label="Search subscriptions"
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(String(value ?? "all"));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-36" aria-label="Filter by category">
                <SelectValue>
                  {(value) => categoryFilterLabels[value ?? ""] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {subscriptionCategories.map((option) => (
                  <SelectItem key={option} value={option}>
                    {categoryLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(String(value ?? "all"));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-32" aria-label="Filter by status">
                <SelectValue>
                  {(value) => statusFilterLabels[value ?? ""] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {subscriptionStatuses.map((option) => (
                  <SelectItem key={option} value={option}>
                    {statusLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          rows.length === 0 ? (
            <EmptyState
              title="No subscriptions yet"
              description="Add your first subscription to see it here with its renewals and costs."
              action={
                onAdd ? (
                  <Button size="sm" onClick={onAdd}>
                    <PlusIcon />
                    Add subscription
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title="No matches"
              description="No subscriptions match the current search and filters."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcwIcon />
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableColumns.map((column) => {
                    const isActive = sort.key === column.key;
                    const Icon = !isActive
                      ? ArrowUpDownIcon
                      : sort.direction === "asc"
                        ? ArrowUpIcon
                        : ArrowDownIcon;
                    return (
                      <TableHead
                        key={column.key}
                        className={column.className}
                        aria-sort={
                          isActive
                            ? sort.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <Button
                          variant="ghost"
                          size="xs"
                          className="-ml-1.5 h-6 gap-1 px-1.5 font-medium text-muted-foreground"
                          onClick={() => toggleSort(column.key)}
                        >
                          {column.label}
                          <Icon className="size-3" />
                        </Button>
                      </TableHead>
                    );
                  })}
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProviderAvatar subscription={subscription} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{subscription.name}</p>
                          {subscription.provider ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {subscription.provider}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(subscription.amountMinor, subscription.currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {subscription.nextBillingDate ? (
                        <div>
                          <p className="tabular-nums">
                            {formatDate(subscription.nextBillingDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRenewalLabel(subscription.nextBillingDate)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground tabular-nums">
                      {formatDate(subscription.createdAt.slice(0, 10))}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <CategoryTag category={subscription.category} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatBillingInterval(
                        subscription.interval,
                        subscription.intervalCount,
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={subscription.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${subscription.name}`}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => onEdit(subscription)}
                          >
                            <PencilIcon className="text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          {subscription.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => runMutation("cancel", subscription)}
                            >
                              <XCircleIcon className="text-muted-foreground" />
                              Cancel subscription
                            </DropdownMenuItem>
                          ) : null}
                          {subscription.status === "cancelled" ||
                            subscription.status === "paused" ||
                            subscription.status === "expired" ? (
                            <DropdownMenuItem
                              onClick={() => runMutation("restore", subscription)}
                            >
                              <PlayIcon className="text-muted-foreground" />
                              Mark as active
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingDelete(subscription)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground tabular-nums">
                Page {safePage} of {pageCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.name}” will be permanently removed along with its renewal reminders. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                await runMutation("delete", pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
