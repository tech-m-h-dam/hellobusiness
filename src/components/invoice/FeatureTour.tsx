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
 *
 * Phone layout is not a narrower version of the desktop one — it shows the form
 * and the document one at a time behind a toggle. A step that points at
 * something in the hidden pane would be highlighting a `display: none` element
 * (a zero-sized rect at the top-left corner), so steps declare which pane they
 * need and the tour switches to it before measuring.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tour-seen-v1";

/** The inline-edit control the document step opens to demonstrate itself. */
const DEMO_FIELD = '[data-print="area"] button[aria-label^="Document title"]';

type Step = {
  /** CSS selector for the element to highlight; null centres the step. */
  target: string | null;
  title: string;
  body: string;
  /**
   * Copy used on touch devices, where the same feature behaves differently —
   * inline editing on the document is pointer-only (see InvoicePreview), so
   * telling a phone user to tap the invoice would be telling them to do
   * something that does nothing.
   */
  touchBody?: string;
  /** Which pane the phone layout must be showing for `target` to be visible. */
  mobileView?: "edit" | "preview";
  /**
   * Open a real inline-edit field while this step is showing, so the tour
   * demonstrates click-to-edit instead of only describing it. Cancelled again
   * when the step is left, so it never changes the invoice.
   */
  demo?: boolean;
};

const STEPS: Step[] = [
  {
    target: null,
    title: "Welcome — here's the quick tour",
    body: "Five steps, about twenty seconds. You can skip it at any point and everything still works.",
  },
  {
    target: "[data-editor-panel]",
    mobileView: "edit",
    title: "Fill in your invoice here",
    body: "Your business, the client, line items, tax and payment details — grouped into tabs. Everything saves in this browser as you type.",
  },
  {
    target: '[data-print="area"]',
    mobileView: "preview",
    demo: true,
    title: "Or edit straight on the document",
    body: "Click any text on the invoice to change it — we've opened the title for you. Click a label like 'Bill To' to rename it to whatever your business calls it.",
    touchBody:
      "This is the finished invoice, updating as you type. Use the Edit and Preview buttons to switch between the form and the document — on a phone you fill it in from the form, and the document is what you get.",
  },
  {
    target: "[data-tour='design']",
    mobileView: "edit",
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

/** Gap between the highlight ring and both the target and the step card. */
const PAD = 8;
const GAP = 12;
/** Keep the card this far from the viewport edges. */
const MARGIN = 16;

/**
 * An element that is `display: none` still answers `getBoundingClientRect()` —
 * with zeros. Treating that as a real rect draws a 16px highlight in the
 * corner, which is how the phone tour used to point at the hidden document.
 */
function isMeasurable(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

export function FeatureTour({
  /**
   * Lets the tour switch the phone layout's Edit/Preview toggle, so a step can
   * point at whichever pane it is about. Not passed on pages that render the
   * tour without that toggle.
   */
  onMobileViewChange,
}: {
  onMobileViewChange?: (view: "edit" | "preview") => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(220);
  const cardRef = useRef<HTMLDivElement>(null);
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
    // Leave the phone layout on the form, which is where a new user starts.
    onMobileViewChange?.("edit");
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [onMobileViewChange]);

  const current = STEPS[step];

  // Measure the highlighted element, following it through scroll and resize.
  useLayoutEffect(() => {
    if (!open) return;

    // Ask for the pane this step is about before measuring anything in it.
    if (current?.mobileView) onMobileViewChange?.(current.mobileView);

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
      if (!el || !isMeasurable(el)) {
        // Nothing to point at — fall back to a centred step rather than
        // highlighting a corner of the screen.
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // The editor panel is several screens tall. Highlighting all of it cuts
      // a hole bigger than the viewport, which dims nothing and leaves the card
      // nowhere to sit, so tall targets are clipped to their visible top half.
      const maxHeight = vh * 0.5;
      const top = Math.max(r.top, MARGIN);
      setRect({
        top,
        left: r.left,
        width: r.width,
        height: Math.min(r.height - (top - r.top), maxHeight),
      });
    };

    const el = document.querySelector(current.target);
    // A target taller than the screen is scrolled to its top, not its middle:
    // centring it puts its heading off-screen above the fold.
    const tall = el ? el.getBoundingClientRect().height > window.innerHeight * 0.8 : false;
    el?.scrollIntoView({ block: tall ? "start" : "center", behavior: "smooth" });

    // Re-measure as the pane switch, the scroll and the layout settle. The
    // pane toggle above is a state update in the parent, so the element this
    // step points at does not exist yet on this pass.
    measure();
    const frame = requestAnimationFrame(measure);
    const timers = [80, 200, 420].map((ms) => setTimeout(measure, ms));

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, current, onMobileViewChange]);

  /**
   * Open a real inline-edit field for the duration of the document step.
   *
   * Clicking the control is what a user would do, so the tour shows the actual
   * behaviour rather than a mock-up of it. Leaving the step blurs the input,
   * which commits an unchanged value — InlineField skips the commit when the
   * draft matches, so demonstrating the feature never edits the invoice.
   */
  useEffect(() => {
    if (!open || !current?.demo) return;
    let field: HTMLElement | null = null;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(DEMO_FIELD);
      // Absent on touch devices, where the document is not inline-editable.
      if (!el || !isMeasurable(el)) return;
      field = el;
      el.click();
    }, 500);
    return () => {
      clearTimeout(t);
      if (!field) return;
      const input = document.activeElement;
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.blur();
    };
  }, [open, current]);

  // The card's real height decides whether it fits below the highlight. It is
  // measured rather than assumed because the steps are different lengths and a
  // guessed height pushed the last lines of the longer ones off-screen.
  useLayoutEffect(() => {
    if (!open) return;
    const el = cardRef.current;
    if (!el) return;
    const sync = () => setCardHeight(el.getBoundingClientRect().height);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape inside an open inline-edit field cancels that field; the tour
      // only takes it when the edit demo is not holding focus.
      const editing =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      if (e.key === "Escape" && !editing) finish();
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

  /**
   * Place the card below the highlight when it fits, above it when it does
   * not, and clamped inside the viewport either way. The previous version
   * assumed a fixed card height and only ever nudged downwards, which on a
   * phone put the buttons below the fold.
   */
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  let cardTop: number | string = "50%";
  if (rect) {
    const below = rect.top + rect.height + PAD + GAP;
    const above = rect.top - PAD - GAP - cardHeight;
    const fitsBelow = below + cardHeight + MARGIN <= viewportHeight;
    const raw = fitsBelow ? below : above >= MARGIN ? above : below;
    cardTop = Math.max(MARGIN, Math.min(raw, viewportHeight - cardHeight - MARGIN));
  }

  // Touch devices get the copy that matches what they can actually do.
  const coarse =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  const body = coarse && current.touchBody ? current.touchBody : current.body;

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
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink-950/55" />
      )}

      {/*
       * Click-away on the dimmed area. Deliberately not a button and hidden
       * from assistive technology: it is a pointer shortcut for the close
       * control in the card, and exposing a second "Skip the tour" button —
       * one of them covering the whole screen — put two identically-named
       * controls in the accessibility tree. Keyboard users skip with the X or
       * with Escape.
       */}
      <div aria-hidden="true" onClick={finish} className="absolute inset-0 cursor-default" />

      <div
        ref={cardRef}
        /*
         * Centred with `left` and a transform only. Tailwind's translate
         * utilities set the standalone `translate` property, which composes
         * with — rather than being overridden by — the inline `transform`
         * below; having both applied shifted the card a full width to the
         * left, which on a phone put most of it off-screen.
         */
        className="absolute left-1/2 w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-ink-200 bg-white p-5 shadow-2xl"
        style={{
          top: cardTop,
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
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">{body}</p>

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
