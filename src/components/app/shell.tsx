import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Leaf, PanelLeftClose, PanelLeft, Bell, CloudSun, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_NAV, MOBILE_NAV, NAV_GROUPS } from "./nav";
import { useFarm } from "@/lib/farm-store";
import { useT } from "@/lib/i18n";
import FarmClock from "@/components/app/farm-clock";
import { LanguageSwitch, ThemeSwitch } from "@/components/app/preference-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-xl px-1 py-1">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
        <Leaf className="size-4 text-primary" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-none">PREDI-FARM</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            X
          </span>
        </span>
      )}
    </Link>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-2 pb-6">
      {NAV_GROUPS.map((group) => (
        <div key={t(group.title)}>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              {t(group.title)}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    preload="intent"
                    title={collapsed ? t(item.label) : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/22"
                      />
                    )}
                    <Icon className="relative size-4 shrink-0" />
                    {!collapsed && (
                      <span className="relative min-w-0 truncate font-medium">{t(item.label)}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function TopBar({
  onToggleSidebar,
  collapsed,
  onOpenMobileNav,
}: {
  onToggleSidebar: () => void;
  collapsed: boolean;
  onOpenMobileNav: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    ALL_NAV.find((i) => pathname === i.to) ??
    ALL_NAV.find((i) => pathname.startsWith(`${i.to}/`));
  const { openPlan, forecast, farm, current: weatherNow, signOut } = useFarm();
  const urgent = openPlan.filter((a) => a.urgency === "critical" || a.urgency === "today").length;
  const today = forecast[0];
  const initials = farm.farmer
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();


  const t = useT();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="hidden size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:grid"
      >
        {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
      </button>
      <button
        onClick={onOpenMobileNav}
        aria-label={t("Open navigation")}
        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 lg:hidden"
      >
        <PanelLeft className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{current ? t(current.label) : "PREDI-FARM X"}</p>
        <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
          {current ? t(current.description) : null}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <FarmClock className="hidden rounded-full bg-surface-2 px-3 py-1.5 md:flex" showDate={false} />
        <LanguageSwitch compact />
        <ThemeSwitch compact />
        <span className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
          <CloudSun className="size-3.5 text-amber" />
          {weatherNow.tempC}° now · {today.rainMm} mm today
        </span>

        <Link
          to="/dashboard"
          aria-label={`${urgent} actions need attention today`}
          className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Bell className="size-4" />
          {urgent > 0 && (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {urgent}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={t("Account menu")}
              className="grid size-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/25 transition-colors hover:bg-primary/25"
            >
              {initials || "PF"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-semibold">{farm.farmer}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {farm.name} · {farm.village}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">{t("Farm settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut className="size-4" />
              {t("Sign out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}

function MobileNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                preload="intent"
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-[18px]" />
                {t(item.short)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 236 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="sticky top-0 hidden h-dvh flex-none flex-col overflow-hidden border-r border-border/70 bg-surface-1/40 lg:flex"
      >
        <div className="px-3 py-4">
          <BrandMark compact={collapsed} />
        </div>
        <NavList collapsed={collapsed} />
      </motion.aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-background lg:hidden"
            >
              <div className="flex items-center justify-between px-3 py-4">
                <BrandMark />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("Close navigation")}
                  className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNavBar />
    </div>
  );
}
