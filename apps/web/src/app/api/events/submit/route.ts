import { NextResponse } from "next/server";
import { getServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase-server";
import { eventSubmissionSchema } from "@/lib/event-submission-schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const parsed = eventSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!hasServerSupabaseConfig()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { title, artistName, venueName, eventDate, category, description, ticketUrl, submitterName, submitterEmail } =
    parsed.data;

  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from("event_submissions").insert({
    title,
    artist_name: artistName || null,
    venue_name: venueName || null,
    event_date: eventDate || null,
    category: category || null,
    description: description || null,
    ticket_url: ticketUrl || null,
    submitter_name: submitterName || null,
    submitter_email: submitterEmail,
  });

  if (error) {
    console.error("[api/events/submit] insert failed", error);
    return NextResponse.json({ error: "submission_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
