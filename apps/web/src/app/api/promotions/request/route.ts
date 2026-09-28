import { NextResponse } from "next/server";
import { getServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase-server";
import { parseBudgetToCents, promotionRequestSchema } from "@/lib/promotion-request-schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const parsed = promotionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!hasServerSupabaseConfig()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const {
    organization,
    eventTitle,
    contactName,
    contactEmail,
    contactPhone,
    package: promotionPackage,
    preferredStart,
    preferredEnd,
    budget,
    message,
  } = parsed.data;

  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from("promotion_requests").insert({
    organization,
    event_title: eventTitle || null,
    contact_name: contactName || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    package: promotionPackage,
    preferred_start: preferredStart || null,
    preferred_end: preferredEnd || null,
    budget_cents: parseBudgetToCents(budget),
    message: message || null,
  });

  if (error) {
    console.error("[api/promotions/request] insert failed", error);
    return NextResponse.json({ error: "submission_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
