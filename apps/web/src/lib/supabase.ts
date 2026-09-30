import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig()) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false },
  });
}

export type Venue = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  is_active?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  artist_name: string;
  description: string | null;
  hero_image_url: string | null;
  event_date: string;
  status: "draft" | "published" | "archived";
  venue_id: string | null;
  ticket_url?: string | null;
  category?: string;
  is_promoted?: boolean;
  promoted_until?: string | null;
  ticketmaster_relevance_rank?: number | null;
  source?: "manual" | "sync" | "submission";
  venues?: Venue | null;
};

export type MerchItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  inventory_count: number;
  image_url: string | null;
  is_active: boolean;
};
