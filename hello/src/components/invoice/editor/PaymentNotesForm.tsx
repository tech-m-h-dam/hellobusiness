"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { SignaturePad } from "./SignaturePad";

export function PaymentNotesForm() {
  const payment = useInvoiceEditor((s) => s.invoice.payment);
  const qr = useInvoiceEditor((s) => s.invoice.qr);
  const notes = useInvoiceEditor((s) => s.invoice.notes);
  const terms = useInvoiceEditor((s) => s.invoice.terms);
  const settings = useInvoiceEditor((s) => s.invoice.settings);
  const update = useInvoiceEditor((s) => s.update);

  const setPayment = <K extends keyof typeof payment>(key: K, value: (typeof payment)[K]) =>
    update((inv) => ({ ...inv, payment: { ...inv.payment, [key]: value } }));

  const setQr = <K extends keyof typeof qr>(key: K, value: (typeof qr)[K]) =>
    update((inv) => ({ ...inv, qr: { ...inv.qr, [key]: value } }));

  const setSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    update((inv) => ({ ...inv, settings: { ...inv.settings, [key]: value } }));

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-800">Bank details</h3>
          <Switch
            aria-label="Show bank details on the invoice"
            checked={settings.showBankDetails}
            onCheckedChange={(c) => setSetting("showBankDetails", c)}
          />
        </div>
        {settings.showBankDetails && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bank name" htmlFor="pay-bank">
                <Input id="pay-bank" value={payment.bankName ?? ""} onChange={(e) => setPayment("bankName", e.target.value)} />
              </Field>
              <Field label="Account name" htmlFor="pay-accname">
                <Input id="pay-accname" value={payment.accountName ?? ""} onChange={(e) => setPayment("accountName", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Account number" htmlFor="pay-accnum">
                <Input id="pay-accnum" value={payment.accountNumber ?? ""} onChange={(e) => setPayment("accountNumber", e.target.value)} />
              </Field>
              <Field label="IFSC / Routing / SWIFT" htmlFor="pay-ifsc">
                <Input id="pay-ifsc" value={payment.ifsc ?? ""} onChange={(e) => setPayment("ifsc", e.target.value)} />
              </Field>
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[13px] font-semibold text-ink-800">Online payment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="UPI ID" htmlFor="pay-upi" hint="Used for the UPI QR code">
            <Input id="pay-upi" value={payment.upiId ?? ""} onChange={(e) => setPayment("upiId", e.target.value)} placeholder="name@bank" />
          </Field>
          <Field label="Payment link" htmlFor="pay-link">
            <Input id="pay-link" value={payment.paymentLink ?? ""} onChange={(e) => setPayment("paymentLink", e.target.value)} placeholder="https://…" />
          </Field>
        </div>
      </section>

      {/* QR ---------------------------------------------------------------- */}
      <section className="space-y-3 rounded-lg border border-ink-200 p-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="qr-enabled" className="cursor-pointer">Show a payment QR code</Label>
            <p className="text-[12px] text-ink-500">Generated in your browser — nothing is sent anywhere.</p>
          </div>
          <Switch
            id="qr-enabled"
            checked={qr.enabled}
            onCheckedChange={(c) => {
              setQr("enabled", c);
              setSetting("showQr", c);
            }}
          />
        </div>
        {qr.enabled && (
          <>
            <Field label="QR contains" htmlFor="qr-source">
              <Select value={qr.source} onValueChange={(v) => setQr("source", v as "upi" | "link" | "custom")}>
                <SelectTrigger id="qr-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI payment request</SelectItem>
                  <SelectItem value="link">Payment link</SelectItem>
                  <SelectItem value="custom">Custom text</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {qr.source === "custom" && (
              <Field label="Custom QR content" htmlFor="qr-custom">
                <Input id="qr-custom" value={qr.customValue ?? ""} onChange={(e) => setQr("customValue", e.target.value)} />
              </Field>
            )}
            <Field label="Caption" htmlFor="qr-caption">
              <Input id="qr-caption" value={qr.caption ?? ""} onChange={(e) => setQr("caption", e.target.value)} />
            </Field>
          </>
        )}
      </section>

      {/* Notes / terms ----------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="notes" className="cursor-pointer">Notes</Label>
          <Switch
            aria-label="Show notes on the invoice"
            checked={settings.showNotes}
            onCheckedChange={(c) => setSetting("showNotes", c)}
          />
        </div>
        <Textarea
          id="notes"
          rows={2}
          value={notes ?? ""}
          onChange={(e) => update((inv) => ({ ...inv, notes: e.target.value }))}
          placeholder="Thank you for your business."
        />

        <div className="flex items-center justify-between">
          <Label htmlFor="terms" className="cursor-pointer">Terms &amp; conditions</Label>
          <Switch
            aria-label="Show terms on the invoice"
            checked={settings.showTerms}
            onCheckedChange={(c) => setSetting("showTerms", c)}
          />
        </div>
        <Textarea
          id="terms"
          rows={2}
          value={terms ?? ""}
          onChange={(e) => update((inv) => ({ ...inv, terms: e.target.value }))}
          placeholder="Late payments are subject to a 2% monthly fee."
        />
      </section>

      {/* Signature --------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-800">Signature</h3>
          <Switch
            aria-label="Show signature on the invoice"
            checked={settings.showSignature}
            onCheckedChange={(c) => setSetting("showSignature", c)}
          />
        </div>
        {settings.showSignature && <SignaturePad />}
      </section>
    </div>
  );
}
