/**
 * The five structural layouts. Each composes the same shared parts
 * (see ../parts.tsx) into a different page composition — this is where
 * templates actually differ structurally, as opposed to differing only in
 * the colour/font/table preset carried in `Invoice.settings`.
 */
import {
  BusinessIdentity,
  CustomFieldsBlock,
  type DocProps,
  Editable,
  EditableLabel,
  InvoiceMetaBlock,
  ItemsTable,
  metaPatcher,
  NotesTermsBlock,
  PageFooter,
  PartiesBlock,
  PaymentBlock,
  SignatureBlock,
  TotalsBlock,
  TransportBlock,
} from "../parts";
import { formatInvoiceDate } from "@/lib/invoice/format";
import { labelFor } from "@/lib/invoice/labels";

/** Common bottom section: notes/terms + payment on the left, signature right. */
function DocumentFooterArea(props: DocProps) {
  return (
    <>
      <TransportBlock {...props} />
      <div className="mt-8 grid grid-cols-[1fr_auto] gap-8">
        <div className="space-y-4">
          <NotesTermsBlock {...props} />
          <PaymentBlock {...props} />
          <CustomFieldsBlock {...props} section="footer" />
        </div>
        <SignatureBlock {...props} />
      </div>
      <PageFooter {...props} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

export function ClassicLayout(props: DocProps) {
  return (
    <>
      <header className="flex items-start justify-between gap-8">
        <BusinessIdentity {...props} />
        <InvoiceMetaBlock {...props} />
      </header>
      <hr className="my-6 border-ink-200" />
      <PartiesBlock {...props} />
      <CustomFieldsBlock {...props} section="invoice" />
      <div className="mt-6">
        <ItemsTable {...props} />
      </div>
      <div className="mt-6">
        <TotalsBlock {...props} />
      </div>
      <DocumentFooterArea {...props} />
    </>
  );
}

export function BannerLayout(props: DocProps) {
  const { invoice, edit } = props;
  const logoRight = invoice.settings.logoPosition === "right";
  // The title and number printed in the band are the same fields the meta
  // block would render, so they are edited through the same patcher — and the
  // meta block drops its own title to avoid printing it twice.
  const setMeta = metaPatcher(edit);
  return (
    <>
      <header
        className="-mx-[var(--doc-margin)] -mt-[var(--doc-margin)] mb-6 px-[var(--doc-margin)] py-6"
        style={{ backgroundColor: "var(--doc-primary)" }}
      >
        <div className={`flex items-start justify-between gap-8 ${logoRight ? "flex-row-reverse" : ""}`}>
          <BusinessIdentity {...props} tone="light" />
          <div className={logoRight ? "text-left" : "text-right"}>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-white">
              <Editable
                edit={edit}
                value={invoice.invoice.documentTitle}
                placeholder="Invoice"
                ariaLabel="Document title"
                tone="light"
                onCommit={(v) => setMeta("documentTitle", v)}
              />
            </h1>
            <p className="mt-1 text-[13px] text-white/90">
              #
              <Editable
                edit={edit}
                value={invoice.invoice.number}
                placeholder="0001"
                ariaLabel="Invoice number"
                tone="light"
                onCommit={(v) => setMeta("number", v)}
              />
            </p>
          </div>
        </div>
      </header>
      <div className="flex items-start justify-between gap-8">
        <PartiesBlock {...props} />
        <div className="shrink-0">
          <InvoiceMetaBlock {...props} showTitle={false} />
        </div>
      </div>
      <CustomFieldsBlock {...props} section="invoice" />
      <div className="mt-6">
        <ItemsTable {...props} />
      </div>
      <div className="mt-6">
        <TotalsBlock {...props} />
      </div>
      <DocumentFooterArea {...props} />
    </>
  );
}

export function SidebarLayout(props: DocProps) {
  const { invoice } = props;
  return (
    <div className="flex gap-6">
      <aside
        data-doc-band="sidebar"
        className="-my-[var(--doc-margin)] -ml-[var(--doc-margin)] w-52 shrink-0 px-5 py-[var(--doc-margin)] text-white"
        style={{ backgroundColor: "var(--doc-primary)" }}
      >
        <BusinessIdentity {...props} tone="light" />
        <div className="mt-6 space-y-4 text-[11px] text-white/85">
          {/* Reuses the shared parties block so inline editing works here too;
              the sidebar's own colours are applied by the wrapper. */}
          <div className="[&_*]:!text-white [&_p.uppercase]:!text-white/60 [&>div]:!grid-cols-1">
            <PartiesBlock {...props} />
          </div>
          {invoice.settings.showPaymentDetails && (
            <div className="border-t border-white/20 pt-3 [&_*]:!text-white/85 [&_p.font-semibold]:!text-white/60">
              <PaymentBlock {...props} />
            </div>
          )}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <InvoiceMetaBlock {...props} align="left" />
        <CustomFieldsBlock {...props} section="invoice" />
        <div className="mt-5">
          <ItemsTable {...props} />
        </div>
        <div className="mt-6">
          <TotalsBlock {...props} />
        </div>
        <TransportBlock {...props} />
        <div className="mt-8 grid grid-cols-[1fr_auto] gap-8">
          <div className="space-y-4">
            <NotesTermsBlock {...props} />
            {/* Payment lives in the sidebar for this layout, but the footer
                custom fields have nowhere else to go — without this they were
                the one block that silently vanished on sidebar templates. */}
            <CustomFieldsBlock {...props} section="footer" />
          </div>
          <SignatureBlock {...props} />
        </div>
        <PageFooter {...props} />
      </div>
    </div>
  );
}

export function SplitLayout(props: DocProps) {
  const { invoice, edit } = props;
  const m = invoice.invoice;
  const setMeta = metaPatcher(edit);
  // Same meta fields the classic header shows, laid out inside the coloured
  // card. They go through `Editable` so this template is editable like the
  // others, and through `formatInvoiceDate` so the date-format setting applies
  // here too rather than printing the raw ISO value.
  const rows = [
    {
      key: "number" as const,
      labelKey: "invoiceNumber" as const,
      raw: m.number,
      display: m.number,
      strong: true,
      show: true,
    },
    {
      key: "date" as const,
      labelKey: "invoiceDate" as const,
      raw: m.date,
      display: formatInvoiceDate(m.date, invoice.settings.dateFormat),
      strong: false,
      show: true,
    },
    {
      key: "dueDate" as const,
      labelKey: "dueDate" as const,
      raw: m.dueDate ?? "",
      display: formatInvoiceDate(m.dueDate, invoice.settings.dateFormat),
      strong: false,
      show: invoice.settings.showDueDate && (Boolean(m.dueDate) || Boolean(edit)),
    },
  ];
  return (
    <>
      <header className="grid grid-cols-2 gap-8">
        <BusinessIdentity {...props} />
        <div
          className="rounded-lg px-5 py-4 text-white"
          style={{ backgroundColor: "var(--doc-primary)" }}
        >
          <h1 className="text-xl font-bold uppercase tracking-wider">
            <Editable
              edit={edit}
              value={m.documentTitle}
              placeholder="Invoice"
              ariaLabel="Document title"
              tone="light"
              onCommit={(v) => setMeta("documentTitle", v)}
            />
          </h1>
          <dl className="mt-2 space-y-0.5 text-[11.5px] text-white/90">
            {rows.map((row) =>
              row.show ? (
                <div key={row.key} className="flex justify-between gap-4">
                  <dt>
                    <EditableLabel
                      edit={edit}
                      invoice={invoice}
                      labelKey={row.labelKey}
                      tone="light"
                    />
                  </dt>
                  <dd className={row.strong ? "font-medium" : undefined}>
                    <Editable
                      edit={edit}
                      value={row.raw}
                      display={row.display}
                      dateInput={row.key !== "number"}
                      ariaLabel={labelFor(invoice, row.labelKey)}
                      placeholder="—"
                      tone="light"
                      onCommit={(v) => setMeta(row.key, v)}
                    />
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      </header>
      <div className="mt-6">
        <PartiesBlock {...props} />
      </div>
      <CustomFieldsBlock {...props} section="invoice" />
      <div className="mt-6">
        <ItemsTable {...props} />
      </div>
      <div className="mt-6">
        <TotalsBlock {...props} />
      </div>
      <DocumentFooterArea {...props} />
    </>
  );
}

export function CompactLayout(props: DocProps) {
  const { invoice, edit } = props;
  const m = invoice.invoice;
  const setMeta = metaPatcher(edit);

  /**
   * Compact means tighter type and spacing — not less of the invoice. This
   * header used to re-implement a cut-down business block inline, which is why
   * the logo, the address, the website and the tax IDs were missing on screen
   * while the PDF and Word exports (which share the full block) printed them.
   * It now composes the same `BusinessIdentity` every other layout uses, at its
   * compact type scale.
   */
  return (
    <>
      <header
        className="flex items-start justify-between gap-6 border-b-2 pb-3"
        style={{ borderColor: "var(--doc-primary)" }}
      >
        <BusinessIdentity {...props} size="compact" />
        <div className="shrink-0 text-right">
          <h1 className="text-lg font-bold uppercase tracking-wide" style={{ color: "var(--doc-primary)" }}>
            <Editable
              edit={edit}
              value={m.documentTitle}
              placeholder="Invoice"
              ariaLabel="Document title"
              onCommit={(v) => setMeta("documentTitle", v)}
            />
          </h1>
          <p className="text-[10.5px] text-ink-600">
            #
            <Editable
              edit={edit}
              value={m.number}
              placeholder="0001"
              ariaLabel="Invoice number"
              onCommit={(v) => setMeta("number", v)}
            />
            {" · "}
            <Editable
              edit={edit}
              value={m.date}
              display={formatInvoiceDate(m.date, invoice.settings.dateFormat)}
              dateInput
              placeholder="—"
              ariaLabel={labelFor(invoice, "invoiceDate")}
              onCommit={(v) => setMeta("date", v)}
            />
            {invoice.settings.showDueDate && (m.dueDate || edit) && (
              <>
                {" · "}
                <EditableLabel edit={edit} invoice={invoice} labelKey="dueDate" />:{" "}
                <Editable
                  edit={edit}
                  value={m.dueDate ?? ""}
                  display={formatInvoiceDate(m.dueDate, invoice.settings.dateFormat)}
                  dateInput
                  placeholder="—"
                  ariaLabel={labelFor(invoice, "dueDate")}
                  onCommit={(v) => setMeta("dueDate", v)}
                />
              </>
            )}
          </p>
          {(m.purchaseOrder || edit) && (
            <p className="text-[10.5px] text-ink-600">
              <EditableLabel edit={edit} invoice={invoice} labelKey="poNumber" />:{" "}
              <Editable
                edit={edit}
                value={m.purchaseOrder ?? ""}
                placeholder="—"
                ariaLabel={labelFor(invoice, "poNumber")}
                onCommit={(v) => setMeta("purchaseOrder", v)}
              />
            </p>
          )}
          {(m.reference || edit) && (
            <p className="text-[10.5px] text-ink-600">
              <EditableLabel edit={edit} invoice={invoice} labelKey="reference" />:{" "}
              <Editable
                edit={edit}
                value={m.reference ?? ""}
                placeholder="—"
                ariaLabel={labelFor(invoice, "reference")}
                onCommit={(v) => setMeta("reference", v)}
              />
            </p>
          )}
        </div>
      </header>
      <div className="mt-3 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <PartiesBlock {...props} size="compact" />
        </div>
        <CustomFieldsBlock {...props} section="invoice" />
      </div>
      <div className="mt-4">
        <ItemsTable {...props} />
      </div>
      <div className="mt-4">
        <TotalsBlock {...props} />
      </div>
      <DocumentFooterArea {...props} />
    </>
  );
}

export const LAYOUTS = {
  classic: ClassicLayout,
  banner: BannerLayout,
  sidebar: SidebarLayout,
  split: SplitLayout,
  compact: CompactLayout,
} as const;
