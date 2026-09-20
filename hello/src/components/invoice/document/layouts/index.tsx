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
  InvoiceMetaBlock,
  ItemsTable,
  NotesTermsBlock,
  PageFooter,
  PartiesBlock,
  PaymentBlock,
  SignatureBlock,
  TotalsBlock,
} from "../parts";

/** Common bottom section: notes/terms + payment on the left, signature right. */
function DocumentFooterArea(props: DocProps) {
  return (
    <>
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
  const { invoice } = props;
  const logoRight = invoice.settings.logoPosition === "right";
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
              {invoice.invoice.documentTitle || "Invoice"}
            </h1>
            <p className="mt-1 text-[13px] text-white/90">#{invoice.invoice.number}</p>
          </div>
        </div>
      </header>
      <div className="flex items-start justify-between gap-8">
        <PartiesBlock {...props} />
        <div className="shrink-0">
          <InvoiceMetaBlock {...props} />
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
        <div className="mt-8 grid grid-cols-[1fr_auto] gap-8">
          <NotesTermsBlock {...props} />
          <SignatureBlock {...props} />
        </div>
        <PageFooter {...props} />
      </div>
    </div>
  );
}

export function SplitLayout(props: DocProps) {
  const { invoice } = props;
  return (
    <>
      <header className="grid grid-cols-2 gap-8">
        <BusinessIdentity {...props} />
        <div
          className="rounded-lg px-5 py-4 text-white"
          style={{ backgroundColor: "var(--doc-primary)" }}
        >
          <h1 className="text-xl font-bold uppercase tracking-wider">
            {invoice.invoice.documentTitle || "Invoice"}
          </h1>
          <dl className="mt-2 space-y-0.5 text-[11.5px] text-white/90">
            <div className="flex justify-between gap-4">
              <dt>Invoice #</dt>
              <dd className="font-medium">{invoice.invoice.number}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Date</dt>
              <dd>{invoice.invoice.date}</dd>
            </div>
            {invoice.settings.showDueDate && invoice.invoice.dueDate && (
              <div className="flex justify-between gap-4">
                <dt>Due</dt>
                <dd>{invoice.invoice.dueDate}</dd>
              </div>
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
  return (
    <>
      <header className="flex items-baseline justify-between gap-6 border-b-2 pb-3" style={{ borderColor: "var(--doc-primary)" }}>
        <div>
          <p className="text-[15px] font-bold text-ink-900">{props.invoice.business.name || "Your Business Name"}</p>
          <p className="text-[10.5px] text-ink-500">
            {[props.invoice.business.city, props.invoice.business.email, props.invoice.business.phone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-bold uppercase tracking-wide" style={{ color: "var(--doc-primary)" }}>
            {props.invoice.invoice.documentTitle || "Invoice"}
          </h1>
          <p className="text-[10.5px] text-ink-600">
            #{props.invoice.invoice.number} · {props.invoice.invoice.date}
          </p>
        </div>
      </header>
      <div className="mt-3 flex items-start justify-between gap-6 text-[11px]">
        <div>
          <span className="font-semibold uppercase tracking-wide text-ink-500">Bill to: </span>
          <span className="font-medium text-ink-900">{props.invoice.customer.name || "Customer name"}</span>
          {props.invoice.customer.billingAddress && (
            <p className="whitespace-pre-line text-ink-600">{props.invoice.customer.billingAddress}</p>
          )}
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
