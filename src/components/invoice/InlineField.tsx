"use client";

/**
 * A single click-to-edit field rendered on the invoice document.
 *
 * Reads as ordinary document text until clicked, then becomes an input sized to
 * the text it replaces, so the document does not reflow as you move between
 * fields. Commits on blur or Enter, abandons on Escape.
 *
 * Implemented with a real <input>/<textarea> rather than `contentEditable`:
 * contentEditable accepts pasted markup, fights React's control of the DOM, and
 * behaves inconsistently across browsers for things as basic as Enter. A real
 * form control gets correct IME behaviour, mobile keyboards of the right type,
 * and accessibility for free.
 */
import { useLayoutEffect, useRef, useState } from "react";
import type { InlineFieldSpec } from "@/lib/invoice/inline-edit";

export function InlineField({
  value,
  display,
  onCommit,
  ariaLabel,
  placeholder,
  multiline,
  numeric,
  dateInput,
  tone = "dark",
  className = "",
}: InlineFieldSpec) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /**
   * The draft is seeded when editing starts rather than mirrored from `value`
   * in an effect. Mirroring would re-render on every keystroke elsewhere in the
   * document and, more importantly, could overwrite what the user is currently
   * typing if the invoice changed underneath them.
   */
  function startEditing() {
    setDraft(value);
    setEditing(true);
  }

  useLayoutEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    const shown = display ?? value;
    const isEmpty = !shown;
    return (
      <button
        type="button"
        onClick={startEditing}
        aria-label={`${ariaLabel}${shown ? `: ${shown}` : ""}. Click to edit.`}
        className={[
          // Inherit the document's own typography so the control is invisible
          // until hovered — this is a document, not a form.
          "cursor-text rounded-[3px] text-left font-[inherit] text-[length:inherit] leading-[inherit] text-[color:inherit]",
          "hover:outline hover:outline-1 hover:outline-dashed",
          // On a coloured band the document text is white, so the light hover
          // wash would hide it; tint the band itself instead.
          tone === "light"
            ? "hover:bg-white/20 hover:outline-white/70"
            : "hover:bg-brand-50/70 hover:outline-brand-300",
          "focus-visible:outline-2 focus-visible:outline-brand-600",
          multiline ? "block w-full whitespace-pre-line" : "inline",
          isEmpty ? (tone === "light" ? "italic opacity-70" : "text-ink-400 italic") : "",
          className,
        ].join(" ")}
      >
        {isEmpty ? (placeholder ?? "—") : shown}
      </button>
    );
  }

  const shared = {
    ref: inputRef as never,
    value: draft,
    "aria-label": ariaLabel,
    placeholder,
    onBlur: commit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
      // In a textarea Enter inserts a newline; Cmd/Ctrl+Enter commits.
      if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    },
    className: [
      "w-full rounded-[3px] bg-white font-[inherit] text-[length:inherit] leading-[inherit]",
      "outline outline-2 outline-brand-500",
      className,
    ].join(" "),
    // The open input always sits on white, including inside a coloured band
    // or sidebar where the surrounding document text is white. Inheriting that
    // colour would make what you are typing invisible, so the text colour is
    // pinned here rather than inherited.
    style: { color: "#0f172a" } as const,
  };

  if (multiline) return <textarea {...shared} rows={Math.max(2, draft.split("\n").length)} />;

  return (
    <input
      {...shared}
      // `date` gives the native picker for date fields while still editing the
      // raw ISO value the model stores.
      type={numeric ? "number" : dateInput ? "date" : "text"}
      step={numeric ? "any" : undefined}
    />
  );
}
