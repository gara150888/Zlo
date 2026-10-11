'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BellIcon, SearchIcon } from "lucide-react"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  subscriptions: "Subscriptions",
  renewals: "Upcoming renewals",
  analytics: "Analytics",
  settings: "Settings",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split("/").filter(Boolean)
  const currentLabel =
    routeLabels[segments[0] ?? ""] ?? "Dashboard"

  const searchSubscriptions = (value: string) => {
    const term = value.trim()
    router.push(term ? `/subscriptions?q=${encodeURIComponent(term)}` : "/subscriptions")
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-1 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink render={<Link href="/dashboard" />}>
                      Zlo
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {segments[0] ? (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-3">
              <form
                className="relative hidden sm:block"
                onSubmit={(event) => {
                  event.preventDefault()
                  const input = event.currentTarget.elements.namedItem(
                    "subscription-search",
                  ) as HTMLInputElement | null
                  searchSubscriptions(input?.value ?? "")
                }}
              >
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="subscription-search"
                  type="search"
                  placeholder="Search subscriptions"
                  aria-label="Search subscriptions"
                  className="h-8 w-44 pl-8 lg:w-56"
                />
              </form>
              <Button
                variant="ghost"
                size="icon-sm"
                nativeButton={false}
                render={<Link href="/settings" />}
                aria-label="Notification preferences"
              >
                <BellIcon />
              </Button>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
