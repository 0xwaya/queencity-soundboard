"use client";

import { useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { PUBLIC_PROMOTION_PACKAGES, PROMOTION_PACKAGE_LABELS } from "@/lib/promotion-request-schema";

const inputClass =
  "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-300";

export default function PromotionRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      organization: String(data.get("organization") ?? ""),
      eventTitle: String(data.get("eventTitle") ?? ""),
      contactName: String(data.get("contactName") ?? ""),
      contactEmail: String(data.get("contactEmail") ?? ""),
      contactPhone: String(data.get("contactPhone") ?? ""),
      package: String(data.get("package") ?? "spotlight"),
      preferredStart: String(data.get("preferredStart") ?? ""),
      preferredEnd: String(data.get("preferredEnd") ?? ""),
      budget: String(data.get("budget") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    try {
      const response = await fetch("/api/promotions/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      track("promotion_request", { package: payload.package });
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-200">
        Thanks - we received your placement request. We&apos;ll confirm availability, dates and a written quote before
        any payment or publication.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Venue / promoter / brand *
          <input name="organization" required maxLength={200} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Event to promote
          <input name="eventTitle" maxLength={200} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Contact name
          <input name="contactName" maxLength={200} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Email *
          <input name="contactEmail" type="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Phone
          <input name="contactPhone" maxLength={40} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Placement *
          <select name="package" required defaultValue="spotlight" className={inputClass}>
            {PUBLIC_PROMOTION_PACKAGES.map((value) => (
              <option key={value} value={value} className="bg-[#0b1228]">
                {PROMOTION_PACKAGE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Preferred start
          <input name="preferredStart" type="date" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Preferred end
          <input name="preferredEnd" type="date" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Budget (USD)
          <input name="budget" inputMode="decimal" maxLength={20} placeholder="75" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate-200">
        Anything else
        <textarea name="message" rows={4} maxLength={2000} className={inputClass} />
      </label>

      {status === "error" ? (
        <p className="text-sm text-amber-300">Something went wrong. Email event@queencitysoundboard.com and we&apos;ll pick it up.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="qcs-button-3d inline-flex w-fit rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-[#15120a] hover:bg-amber-200 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Request placement"}
      </button>
    </form>
  );
}
