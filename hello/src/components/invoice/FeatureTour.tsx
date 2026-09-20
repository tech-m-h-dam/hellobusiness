"use client";

/**
 * First-run feature tour.
 *
 * Highlights the real elements in place rather than showing screenshots, so
 * what the tour points at is what the user then clicks. Shown once per browser
 * and dismissible at any step — an onboarding flow that reappears is worse than
 * none at all.
 *
 * Deliberately not a blocking modal over the whole app: the invoice stays
 * visible and usable behind it, because the fastest way to understand this tool
 * is to see the document react to what you type.
 */
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tour-seen-v1";

type Step = {
  /** CSS selector for the element to highlight; null centres the step. */
  target: string | null;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: null,
    title: "Welcome — here's the quick tour",
    body: "Four steps, about twenty seconds. You can skip it at any point and everything still works.",
  },
  {
    target: "[data-editor-panel]",
    title: "Fill in your invoice here",
    body: "Your business, the client, line items, tax and payment details — grouped into tabs. Everything saves in this browser as you type.",
  },
  {
    target: '[data-print="area"]',
    title: "Or edit straight on the document",
    body: "Click any text on the invoice to change it — including the headings. Click a label like 'Bill To' to rename it to whatever your business calls it.",
  },
  {
    target: "[data-tour='design']",
    title: "Change the look",
    body: "Pick from 20 templates, choose which columns and sections appear, set your colours and fonts, then save it all as your own reusable template.",
  },
  {
    target: "[data-tour='download']",
    title: "Download or print",
    body: "Export a PDF or an editable Word file, or print straight from the browser. It's all generated on your device — your invoice is never uploaded.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function FeatureTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  // Show once per browser. Reading in an effect (not during render) keeps the
  // server and first client render identical.
  useEffect(() => {
    try {
      // Reading an external store (localStorage) on mount — the case effects
      // exist for. The lint rule cannot tell this apart from deriving state
      // that should have been computed during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // Blocked storage: just don't show the tour rather than showing it forever.
    }
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const current = STEPS[step];

  // Measure the highlighted element, following it through scroll and resize.
  useLayoutEffect(() => {
    if (!open) return;
    if (!current?.target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(null);
      return;
    }

    // Measuring layout is a read of the DOM — an external system — and the
    // result has to become state so the highlight can be positioned. There is
    // no render-time equivalent: the geometry does not exist until after layout.
    const measure = () => {
      const el = document.querySelector(current.target as string);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    const el = document.querySelector(current.target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    // Re-measure after the smooth scroll settles.
    const t = setTimeout(measure, 350);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  // No "mounted" state needed: `open` is false on the server and on the first
  // client render, so the two agree, and the portal target only has to exist by
  // the time the tour actually opens.
  if (!open || typeof document === "undefined") return null;

  const isLast = step === STEPS.length - 1;
  const pad = 8;

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      data-print="hide"
    >
      {/* Dim everything except the highlighted element. A ring plus a very
          large spread shadow cuts the "hole" without four separate overlays. */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-brand-500 transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink-950/55" />
      )}

      {/* Click-away on the dimmed area. */}
      <button
        type="button"
        aria-label="Skip the tour"
        onClick={finish}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        className="absolute left-1/2 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-ink-200 bg-white p-5 shadow-2xl"
        style={{
          // Sit under the highlight when there's room, otherwise above it.
          top: rect
            ? rect.top + rect.height + pad + 12 + 220 > window.innerHeight
              ? Math.max(16, rect.top - pad - 232)
              : rect.top + rect.height + pad + 12
            : "50%",
          transform: rect ? "translateX(-50%)" : "translate(-50%, -50%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-brand-700">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Step {step + 1} of {STEPS.length}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Skip the tour"
            className="rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 id="tour-title" className="mt-2 text-[17px] font-semibold text-ink-900">
          {current.title}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">{current.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`size-1.5 rounded-full transition-colors ${
                  i === step ? "bg-brand-600" : "bg-ink-200"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft /> Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              {isLast ? "Start invoicing" : "Next"}
              {!isLast && <ArrowRight />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Re-open the tour on demand (from a help link). */
export function restartTour() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch {
    /* ignore */
  }
}
