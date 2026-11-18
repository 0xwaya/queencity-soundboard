"use client";

import { track } from "@vercel/analytics";
import { useState, type FormEvent } from "react";

type Props = { placement: string };

/** "This week in Cincy" email capture (case study #14). Render only when isNewsletterEnabled(). */
export default function NewsletterSignup({ placement }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email") ?? ""), company: String(data.get("company") ?? ""), placement }),
      });
      setStatus(response.ok ? "done" : "error");
      if (response.ok) track("newsletter_signup", { placement });
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">You&apos;re in. See you Thursday.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
      <p className="text-base font-bold text-white">Get this week&apos;s best shows every Thursday.</p>
      <p className="mt-1 text-xs text-slate-300">One email a week. Unsubscribe anytime.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`newsletter-${placement}`}>
          Email address
        </label>
        <input
          id={`newsletter-${placement}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-400 disabled:opacity-60"
        >
          {status === "sending" ? "Signing up…" : "Sign up"}
        </button>
      </div>
      {status === "error" ? <p className="mt-2 text-xs text-amber-300">That didn&apos;t go through. Try again in a minute.</p> : null}
    </form>
  );
}
