"use client";

/**
 * E-Way Bill and transport details.
 *
 * Off by default and collapsed behind a toggle: it only applies to the movement
 * of goods under Indian GST, so putting it in front of every user would be
 * noise on the large majority of invoices.
 */
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import type { TransportDetails } from "@/lib/invoice/types";

const MODES = ["Road", "Rail", "Air", "Ship"];

export function TransportForm() {
  const transport = useInvoiceEditor((s) => s.invoice.transport ?? {});
  const showTransport = useInvoiceEditor((s) => s.invoice.settings.showTransport);
  const update = useInvoiceEditor((s) => s.update);

  const set = <K extends keyof TransportDetails>(key: K, value: TransportDetails[K]) =>
    update((inv) => ({ ...inv, transport: { ...inv.transport, [key]: value } }));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5">
        <div>
          <Label htmlFor="transport-toggle" className="cursor-pointer">
            E-Way Bill &amp; transport
          </Label>
          <p className="text-[12px] text-ink-500">
            For goods movement under Indian GST. Prints as its own block.
          </p>
        </div>
        <Switch
          id="transport-toggle"
          checked={showTransport}
          onCheckedChange={(checked) =>
            update((inv) => ({ ...inv, settings: { ...inv.settings, showTransport: checked } }))
          }
        />
      </div>

      {showTransport && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-Way Bill number" htmlFor="eway-no">
              <Input
                id="eway-no"
                value={transport.eWayBillNumber ?? ""}
                onChange={(e) => set("eWayBillNumber", e.target.value)}
                placeholder="12-digit EBN"
              />
            </Field>
            <Field label="E-Way Bill date" htmlFor="eway-date">
              <Input
                id="eway-date"
                type="date"
                value={transport.eWayBillDate ?? ""}
                onChange={(e) => set("eWayBillDate", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Transporter name" htmlFor="transporter-name">
              <Input
                id="transporter-name"
                value={transport.transporterName ?? ""}
                onChange={(e) => set("transporterName", e.target.value)}
              />
            </Field>
            <Field label="Transporter ID" htmlFor="transporter-id" hint="GSTIN or enrolment ID">
              <Input
                id="transporter-id"
                value={transport.transporterId ?? ""}
                onChange={(e) => set("transporterId", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Vehicle number" htmlFor="vehicle-no">
              <Input
                id="vehicle-no"
                value={transport.vehicleNumber ?? ""}
                onChange={(e) => set("vehicleNumber", e.target.value)}
                placeholder="KA 01 AB 1234"
              />
            </Field>
            <Field label="Mode of transport" htmlFor="transport-mode">
              <Select
                value={transport.modeOfTransport ?? ""}
                onValueChange={(v) => set("modeOfTransport", v)}
              >
                <SelectTrigger id="transport-mode">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Place of supply" htmlFor="place-of-supply" hint="Determines CGST+SGST vs IGST">
            <Input
              id="place-of-supply"
              value={transport.placeOfSupply ?? ""}
              onChange={(e) => set("placeOfSupply", e.target.value)}
              placeholder="Karnataka (29)"
            />
          </Field>

          <Field label="Dispatched from" htmlFor="dispatch-from">
            <Textarea
              id="dispatch-from"
              rows={2}
              value={transport.dispatchFrom ?? ""}
              onChange={(e) => set("dispatchFrom", e.target.value)}
              placeholder="Warehouse address, if different from your business address"
            />
          </Field>
        </>
      )}
    </section>
  );
}
