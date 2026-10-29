import { redirect } from "next/navigation";

// Cached and refreshed in the background (case study #11).
export const revalidate = 300;

// Latin events now live in the general events feed, filterable by category.
export default function LatinEventsRedirect() {
  redirect("/events?category=latin");
}
