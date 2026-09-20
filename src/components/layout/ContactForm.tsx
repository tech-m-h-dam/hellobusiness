"use client";

/**
 * Contact form — one of the few places React Hook Form + Zod genuinely fit:
 * a discrete form with a submit action, field-level validation and error
 * display, rather than the live-preview editor where every keystroke has to
 * flow straight into shared state.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Please write a little more").max(5000),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setServerError("Couldn't reach the server. Please check your connection and try again.");
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
        <div>
          <p className="font-medium text-ink-900">Message sent</p>
          <p className="mt-1 text-[14px] text-ink-600">
            Thanks — we&rsquo;ll get back to you at the address you gave.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" required error={errors.name?.message}>
          <Input id="contact-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="contact-email" required error={errors.email?.message}>
          <Input
            id="contact-email"
            type="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject" error={errors.subject?.message}>
        <Input id="contact-subject" {...register("subject")} />
      </Field>

      <Field label="Message" htmlFor="contact-message" required error={errors.message?.message}>
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
        />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
