"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useInvoiceEditor } from "@/stores/invoice-editor";

export function CustomerForm() {
  const customer = useInvoiceEditor((s) => s.invoice.customer);
  const showShipping = useInvoiceEditor((s) => s.invoice.settings.showShipping);
  const update = useInvoiceEditor((s) => s.update);

  const set = <K extends keyof typeof customer>(key: K, value: (typeof customer)[K]) =>
    update((inv) => ({ ...inv, customer: { ...inv.customer, [key]: value } }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer name" htmlFor="cust-name">
          <Input
            id="cust-name"
            value={customer.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Roberts"
          />
        </Field>
        <Field label="Company" htmlFor="cust-company">
          <Input
            id="cust-company"
            value={customer.company ?? ""}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Roberts & Co."
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email" htmlFor="cust-email">
          <Input
            id="cust-email"
            type="email"
            value={customer.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="cust-phone">
          <Input id="cust-phone" value={customer.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>

      <Field label="Billing address" htmlFor="cust-billing">
        <Textarea
          id="cust-billing"
          value={customer.billingAddress ?? ""}
          onChange={(e) => set("billingAddress", e.target.value)}
          placeholder={"12 Market Street\nBristol BS1 4TR\nUnited Kingdom"}
          rows={3}
        />
      </Field>

      <div className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5">
        <Label htmlFor="ship-toggle" className="cursor-pointer">
          Ship to a different address
        </Label>
        <Switch
          id="ship-toggle"
          checked={Boolean(customer.shipToDifferentAddress)}
          onCheckedChange={(checked) => {
            set("shipToDifferentAddress", checked);
            // Keep the document setting in step so the block actually appears.
            if (checked && !showShipping) {
              update((inv) => ({ ...inv, settings: { ...inv.settings, showShipping: true } }));
            }
          }}
        />
      </div>

      {customer.shipToDifferentAddress && (
        <Field label="Shipping address" htmlFor="cust-shipping">
          <Textarea
            id="cust-shipping"
            value={customer.shippingAddress ?? ""}
            onChange={(e) => set("shippingAddress", e.target.value)}
            rows={3}
          />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="GSTIN" htmlFor="cust-gstin">
          <Input id="cust-gstin" value={customer.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} />
        </Field>
        <Field label="Tax ID / VAT number" htmlFor="cust-taxid">
          <Input id="cust-taxid" value={customer.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
