import type { ReactNode } from "react";
import type { Invoice } from "./types";

/**
 * Click-to-edit support for the invoice document.
 *
 * The document renderer is shared by three consumers: the live editor, the
 * statically-generated example pages, and the print path. Only the first is
 * interactive, so interactivity is *injected* rather than imported: the editor
 * passes an `InlineEdit` whose `field` renders a client-side editable control,
 * and everything else passes nothing and gets plain text.
 *
 * Doing it this way — a render prop rather than React context or a "use client"
 * directive on the renderer — keeps components/invoice/document server-
 * compatible, so the example pages ship no editor JavaScript for a document
 * nobody can edit.
 */
export type InlineFieldSpec = {
  /** The raw text that is edited. */
  value: string;
  /**
   * What to show when the field is *not* being edited, when that differs from
   * the raw value — a formatted date or a currency amount, say. Editing still
   * operates on `value`, so a date field stays a real date input and money is
   * typed as a plain number.
   */
  display?: string;
  /** Called with the new text when the edit is committed. */
  onCommit: (next: string) => void;
  /** Accessible name — these controls have no visible label of their own. */
  ariaLabel: string;
  /** Shown, muted, when the value is empty, so empty fields stay discoverable. */
  placeholder?: string;
  multiline?: boolean;
  /** Numeric fields get a number input and are committed as numbers. */
  numeric?: boolean;
  /** Date fields get the native date picker, editing the raw ISO value. */
  dateInput?: boolean;
  className?: string;
};

export type InlineEdit = {
  /** Apply an immutable update to the invoice. */
  patch: (updater: (invoice: Invoice) => Invoice) => void;
  /** Render an editable control. Supplied only by the interactive editor. */
  field: (spec: InlineFieldSpec) => ReactNode;
};
