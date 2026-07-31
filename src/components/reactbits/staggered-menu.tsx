import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel?: string;
  link: string;
}

/**
 * StaggeredMenu — React Bits panel menu rebuilt on the app's tokens. The
 * pre-layers use surface tokens so the reveal reads correctly in light and
 * dark themes.
 */
export default function StaggeredMenu({
  position = "right",
  items = [],
  displayItemNumbering = true,
  className,
  accentColor = "var(--primary)",
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}: {
  position?: "left" | "right";
  items?: StaggeredMenuItem[];
  displayItemNumbering?: boolean;
  className?: string;
  accentColor?: string;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const iconRef = useRef<HTMLSpanElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;
      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;
      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      if (iconRef.current) gsap.set(iconRef.current, { rotate: 0, transformOrigin: "50% 50%" });
    });
    return () => ctx.revert();
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-item-label")) as HTMLElement[];
    const offscreen = position === "left" ? -100 : 100;
    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8 });

    const tl = gsap.timeline({ paused: true });
    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: offscreen },
        { xPercent: 0, duration: 0.5, ease: "power4.out" },
        i * 0.07,
      );
    });
    const insertAt = layers.length ? (layers.length - 1) * 0.07 + 0.08 : 0;
    tl.fromTo(
      panel,
      { xPercent: offscreen },
      { xPercent: 0, duration: 0.62, ease: "power4.out" },
      insertAt,
    );
    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: { each: 0.08 },
        },
        insertAt + 0.1,
      );
    }
    tl.eventCallback("onComplete", () => {
      busyRef.current = false;
    });
    openTlRef.current = tl;
    tl.play(0);
  }, [position]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    if (!panel) return;
    const all = [...preLayerElsRef.current, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === "left" ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        busyRef.current = false;
      },
    });
  }, [position]);

  const setOpenState = useCallback(
    (next: boolean) => {
      openRef.current = next;
      setOpen(next);
      if (next) {
        onMenuOpen?.();
        playOpen();
      } else {
        onMenuClose?.();
        playClose();
      }
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          rotate: next ? 225 : 0,
          duration: next ? 0.7 : 0.35,
          ease: next ? "power4.out" : "power3.inOut",
          overwrite: "auto",
        });
      }
    },
    [onMenuOpen, onMenuClose, playOpen, playClose],
  );

  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(target)
      ) {
        setOpenState(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeOnClickAway, open, setOpenState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) setOpenState(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpenState]);

  const side = position === "left" ? "left-0" : "right-0";

  return (
    <div
      className={cn("pointer-events-none relative z-40", className)}
      data-position={position}
      data-open={open || undefined}
    >
      <button
        ref={toggleBtnRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpenState(!openRef.current)}
        className="pointer-events-auto relative z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-glass-border bg-surface-1/70 px-4 text-sm font-medium text-foreground backdrop-blur-xl"
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span ref={iconRef} className="relative inline-flex size-3.5 items-center justify-center">
          <span className="absolute h-0.5 w-full rounded bg-current" />
          <span className="absolute h-0.5 w-full rotate-90 rounded bg-current" />
        </span>
      </button>

      <div
        ref={preLayersRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-y-0 z-40 w-[min(100vw,26rem)] opacity-0",
          side,
        )}
      >
        <div className="sm-prelayer absolute inset-y-0 right-0 h-full w-full bg-primary/25" />
        <div className="sm-prelayer absolute inset-y-0 right-0 h-full w-full bg-primary/45" />
      </div>

      <div
        ref={panelRef}
        className={cn(
          "pointer-events-auto fixed inset-y-0 z-40 flex w-[min(100vw,26rem)] flex-col gap-2 overflow-y-auto border-glass-border bg-background px-8 pb-10 pt-24 opacity-0",
          side,
          position === "left" ? "border-r" : "border-l",
        )}
        style={{ ["--sm-accent" as string]: accentColor }}
      >
        <ul className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <li key={item.link} className="relative overflow-hidden leading-none">
              <Link
                to={item.link}
                aria-label={item.ariaLabel ?? item.label}
                onClick={() => setOpenState(false)}
                className="type-title group inline-block py-1 uppercase text-foreground transition-colors hover:text-primary"
              >
                <span className="sm-item-label inline-block will-change-transform">
                  {item.label}
                </span>
                {displayItemNumbering && (
                  <span className="ml-3 align-super font-mono text-xs text-primary">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
