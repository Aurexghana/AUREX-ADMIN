"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import PageTransition from "@/components/PageTransition";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useSidebarCollapsed } from "@/lib/sidebarState";
import { useSession } from "@/lib/auth";
import { getPendingApplicationCount } from "@/lib/applications";
import { getOpenReportCount } from "@/lib/reports";
import {
  GridIcon,
  InboxIcon,
  UsersIcon,
  UserIcon,
  LayersIcon,
  CoinsIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  BookIcon,
  CalendarIcon,
  AlertIcon,
  LogOutIcon,
  ChevronDownIcon,
} from "@/components/icons";

type NavLink = {
  label: string;
  href: string;
  icon: (props: import("react").SVGProps<SVGSVGElement>) => React.ReactElement;
  /** Which live count (see NAV_BADGE_COUNTS below) this link's badge
   *  shows, if any - a key, not a boolean: two links both wanting a
   *  badge need two different numbers, not one shared `pendingCount`
   *  variable slapped on whichever link happens to ask for one. */
  badgeKey?: "pendingApplications" | "openReports";
};

const NAV_LINKS: NavLink[] = [
  { label: "Overview", href: "/", icon: GridIcon },
  { label: "Applications", href: "/applications", icon: InboxIcon, badgeKey: "pendingApplications" },
  { label: "Members", href: "/members", icon: UsersIcon },
  { label: "Admins", href: "/admins", icon: UserIcon },
  { label: "Businesses", href: "/businesses", icon: BriefcaseIcon },
  { label: "Investment Slots", href: "/slots", icon: LayersIcon },
  { label: "Record Investment", href: "/investments", icon: CoinsIcon },
  { label: "Payouts", href: "/payouts", icon: CalendarIcon },
  { label: "Home Content", href: "/content", icon: MegaphoneIcon },
  { label: "Reports", href: "/reports", icon: BookIcon, badgeKey: "openReports" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Swapped in below `md` (phone-width screens) instead of the real shell
 * - see AdminShell's own doc comment for why. Deliberately minimal: no
 * nav, no actions, nothing for a phone user to reach for, just the brand
 * mark and a plain explanation of what to do instead.
 */
function UnsupportedViewport() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center md:hidden">
      <BrandLogo className="h-10 w-auto shrink-0" />
      <AlertIcon className="size-7 text-gold-bright" />
      <h1 className="font-jakarta text-lg font-semibold text-cream">Tablet or Larger Required</h1>
      <p className="max-w-xs font-sans text-sm text-cream-dim">
        AUREX Admin manages live investment slots, member accounts, and financial records. These actions need more
        room than a phone screen can safely give, so please switch to a tablet or laptop to continue.
      </p>
    </div>
  );
}

/**
 * The admin app shell: one fixed left sidebar, same at every viewport
 * width - no more separate "collapses to a top bar + hamburger dropdown
 * below `lg`" pattern. That pattern (still how the main site's own
 * Navbar.tsx behaves) existed here to cope with a full-width sidebar
 * having nowhere to go on narrow screens; now that the sidebar collapses
 * to a narrow icon rail on its own (the floating edge toggle below),
 * that's the one affordance this shell needs for tight widths, so the
 * hamburger variant is redundant per feedback and dropped rather than
 * kept alongside it.
 *
 * That toggle is a small circular button pinned to the sidebar's own
 * right border (`<aside>` is already `sticky`-positioned, so it's the
 * anchor for free) rather than living inline in the header row - per
 * feedback with a reference screenshot. Sitting on the border means one
 * fixed spot regardless of collapsed state, and it frees the header back
 * up to just the logo instead of needing to reflow into a column to make
 * room for a second element once collapsed.
 *
 * The collapse toggle's state lives in lib/sidebarState.ts, not a plain
 * useState here - per feedback, it needs to stay collapsed across a route
 * change. Still not synced to localStorage, so a real page reload starts
 * expanded - the ask was "survives navigating", not "survives a reload".
 *
 * Deliberately no AnimatedBackground here (see that component's own
 * comment) - this shell wraps every list/table-heavy admin screen.
 *
 * The footer identity + Log out button now read from lib/auth.ts's
 * stubbed session (see AuthGate, which is what actually keeps a signed-
 * out visitor from reaching this shell in the first place) rather than
 * being static stand-ins. Log out itself goes through the same shared
 * ConfirmDialog every other consequential admin action uses (approve/
 * reject, publish/close-early, delete) rather than firing immediately on
 * click - a stray click here would otherwise drop whatever the admin was
 * in the middle of doing.
 *
 * Below `md` (phone-width screens), this shell doesn't render its
 * children at all - it swaps in `UnsupportedViewport` instead. Per
 * feedback: unlike the main AUREX site, this admin manages live
 * investment slots, funds, and member accounts, and its list→detail
 * flows and multi-field forms genuinely don't fit safely on a phone -
 * so rather than keep shrinking every screen down to a phone-width
 * card reflow, the floor is tablet-and-up, with a clear message below
 * it instead of a half-usable layout. `md:hidden`/`hidden md:flex` (CSS
 * only, no JS viewport check) so there's no hydration flash of the
 * wrong one before a media query can run, same technique already used
 * for every table→card breakpoint in this app, just applied once here
 * instead of per view.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const { session, logout } = useSession();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void getPendingApplicationCount().then((count) => {
      if (!cancelled) setPendingApplications(count);
    });
    void getOpenReportCount().then((count) => {
      if (!cancelled) setOpenReports(count);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const badgeCounts = {
    pendingApplications,
    openReports,
  } as const;

  return (
    <>
      <UnsupportedViewport />

      <div className="hidden min-h-screen w-full flex-1 flex-row md:flex">
        <aside
          className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-grid-line bg-panel/40 transition-[width] duration-200 ease-in-out ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          {/* Floating edge toggle - half on/half off the sidebar's own
              right border, same spot regardless of collapsed state,
              rather than a button competing for space inside the header
              row (which also used to force that row into a column layout
              once collapsed, just to make room for it). `<aside>` is
              already `sticky`-positioned, so it's this button's anchor
              for free, no extra `relative` needed. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-9 z-20 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-grid-line bg-panel text-cream-dim transition-colors hover:border-gold/40 hover:text-gold-bright"
          >
            <ChevronDownIcon className={`size-3 transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} />
          </button>

          <div className="flex items-center justify-start border-b border-grid-line px-5 py-5">
            <Link href="/" className="flex items-center gap-2 overflow-hidden">
              <BrandLogo className="h-8 w-auto shrink-0" />
            </Link>
          </div>

          <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            {NAV_LINKS.map(({ label, href, icon: Icon, badgeKey }) => {
              const active = isActive(pathname, href);
              const badgeCount = badgeKey ? badgeCounts[badgeKey] : 0;
              return (
                <motion.div key={href} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`relative flex items-center gap-2 px-3 py-2.5 font-jakarta text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : "justify-between"
                    } ${active ? "bg-gold/10 text-gold-bright" : "text-cream-dim hover:bg-panel/60 hover:text-cream"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && label}
                    </span>
                    {badgeCount > 0 && (
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-full bg-gold-bright/90 font-jakarta font-bold text-amainblack ${
                          collapsed ? "absolute -right-1 -top-1 size-4 text-[9px]" : "size-5 text-[10px]"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div
            className={`flex items-center border-t border-grid-line py-4 ${
              collapsed ? "justify-center px-3" : "justify-between gap-2 px-5"
            }`}
          >
            {!collapsed && (
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="truncate font-jakarta text-sm font-medium text-cream">
                  {session?.user.nickname ?? "Admin"}
                </span>
                <span className="truncate font-sans text-xs text-cream-dim">{session?.user.email ?? ""}</span>
              </div>
            )}
            <button
              type="button"
              aria-label="Log out"
              title="Log out"
              onClick={() => setLogoutConfirmOpen(true)}
              className="shrink-0 text-cream-dim transition-colors hover:text-gold-bright"
            >
              <LogOutIcon className="size-4" />
            </button>
          </div>
        </aside>

        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          logout();
          router.replace("/login");
        }}
        title="Log out?"
        description="You'll need to sign in again to get back into AUREX Admin."
        confirmLabel="Log Out"
        tone="gold"
      />
    </>
  );
}
