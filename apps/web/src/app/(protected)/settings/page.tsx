"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState } from "@/components/dashboard/states";

const REMINDER_DAY_OPTIONS = [1, 3, 7, 14, 30] as const;

const TIMEZONE_FALLBACK =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

type Preferences = {
  emailEnabled: boolean;
  reminderDays: number[];
  timezone: string;
};

function PreferencesForm() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useQuery(
    trpc.reminderPreference.get.queryOptions(),
  );

  const [draft, setDraft] = useState<Preferences>({
    emailEnabled: true,
    reminderDays: [3],
    timezone: TIMEZONE_FALLBACK,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data && !loaded) {
      setDraft({
        emailEnabled: data.emailEnabled,
        reminderDays: data.reminderDays,
        timezone: data.timezone,
      });
      setLoaded(true);
    }
  }, [data, loaded]);

  const updatePreference = useMutation(
    trpc.reminderPreference.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.reminderPreference.pathFilter());
        toast.success("Notification preferences saved");
      },
    }),
  );

  const isDirty = useMemo(() => {
    if (!data) return false;
    return (
      draft.emailEnabled !== data.emailEnabled ||
      draft.timezone !== data.timezone ||
      draft.reminderDays.join(",") !==
        [...data.reminderDays].sort((a, b) => a - b).join(",")
    );
  }, [data, draft]);

  if (error) {
    return <ErrorState description={error.message} onRetry={() => refetch()} />;
  }

  if (isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const toggleDay = (day: number, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      reminderDays: checked
        ? [...current.reminderDays, day].sort((a, b) => a - b)
        : current.reminderDays.filter((value) => value !== day),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>
          Choose when Zlo emails you before a subscription renews.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="email-enabled"
            checked={draft.emailEnabled}
            onCheckedChange={(checked) =>
              setDraft((current) => ({
                ...current,
                emailEnabled: checked === true,
              }))
            }
          />
          <div className="grid gap-1">
            <Label htmlFor="email-enabled">Email me renewal reminders</Label>
            <p className="text-xs text-muted-foreground">
              Reminders are sent to your account email address.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Reminder days before renewal</Label>
          <div className="flex flex-wrap gap-3">
            {REMINDER_DAY_OPTIONS.map((day) => (
              <div key={day} className="flex items-center gap-2">
                <Checkbox
                  id={`reminder-day-${day}`}
                  checked={draft.reminderDays.includes(day)}
                  onCheckedChange={(checked) => toggleDay(day, checked === true)}
                />
                <Label htmlFor={`reminder-day-${day}`}>{day} days</Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            At least one reminder day is required.
          </p>
        </div>

        <div className="grid gap-2 sm:max-w-72">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={draft.timezone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                timezone: event.target.value,
              }))
            }
            placeholder="Asia/Kolkata"
          />
          <p className="text-xs text-muted-foreground">
            IANA timezone used to schedule reminder emails.
          </p>
        </div>

        <div>
          <Button
            disabled={!isDirty || updatePreference.isPending}
            onClick={() =>
              updatePreference.mutate(
                {
                  emailEnabled: draft.emailEnabled,
                  reminderDays: draft.reminderDays,
                  timezone: draft.timezone.trim() || "UTC",
                },
                {
                  onError: (error) =>
                    toast.error(
                      error.message || "Could not save preferences.",
                    ),
                },
              )
            }
          >
            {updatePreference.isPending ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Your account and notification preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {isPending
              ? "Loading your account…"
              : session
                ? "Signed in with email and password."
                : "You are not signed in."}
          </CardDescription>
        </CardHeader>
        {session ? (
          <CardContent className="grid gap-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </CardContent>
        ) : null}
      </Card>

      <Separator />

      <PreferencesForm />
    </div>
  );
}
