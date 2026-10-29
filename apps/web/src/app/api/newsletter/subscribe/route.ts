import { NextResponse } from "next/server";
import { getNewsletterProvider, newsletterSignupSchema } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

/** Case study #14 scaffold: returns 503 until the newsletter flag and provider keys are set. */
export async function POST(request: Request) {
  const provider = getNewsletterProvider();
  if (!provider) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const parsed = newsletterSignupSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const response = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(provider.publicationId)}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: parsed.data.email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: "queencitysoundboard.com",
      utm_medium: parsed.data.placement ?? "site",
    }),
  });
  if (!response.ok) {
    console.error("[api/newsletter/subscribe] provider error", response.status);
    return NextResponse.json({ error: "subscribe_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
