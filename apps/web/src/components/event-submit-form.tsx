"use client";

import { useState, type FormEvent } from "react";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

export default function EventSubmitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? ""),
      artistName: String(data.get("artistName") ?? ""),
      venueName: String(data.get("venueName") ?? ""),
      eventDate: String(data.get("eventDate") ?? ""),
      category: String(data.get("category") ?? ""),
      description: String(data.get("description") ?? ""),
      ticketUrl: String(data.get("ticketUrl") ?? ""),
      submitterName: String(data.get("submitterName") ?? ""),
      submitterEmail: String(data.get("submitterEmail") ?? ""),
    };

    try {
      const response = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-200">
        Thanks — your event is in the review queue. We&apos;ll follow up if we need more details.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Event title *
          <input
            name="title"
            required
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Artist / performer
          <input
            name="artistName"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Venue
          <input
            name="venueName"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Date &amp; time
          <input
            name="eventDate"
            type="datetime-local"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Category
          <select
            name="category"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          >
            <option value="">Select one</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Ticket link
          <input
            name="ticketUrl"
            type="url"
            placeholder="https://"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate-200">
        Description
        <textarea
          name="description"
          rows={3}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Your name
          <input
            name="submitterName"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          Your email *
          <input
            name="submitterEmail"
            type="email"
            required
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400"
          />
        </label>
      </div>

      {status === "error" ? (
        <p className="text-sm text-rose-300">Something went wrong — please try again or email us directly.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="qcs-button-3d w-fit rounded-lg bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400 disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit event"}
      </button>
    </form>
  );
}
