#!/usr/bin/env python3
"""
Lightweight social media agent for QCS.
Generates a weekly content plan using Supabase event + poll data.
"""
from __future__ import annotations

import os
import json
import datetime as dt
from pathlib import Path
import requests

BASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not BASE_URL or not ANON_KEY:
    raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
}


def fetch_events():
    url = f"{BASE_URL}/rest/v1/events?select=title,event_date,artist_name,description,status&order=event_date.asc"
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.json()


def fetch_votes():
    url = f"{BASE_URL}/rest/v1/artist_votes?select=artist_name"
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.json()


def main():
    events = [e for e in fetch_events() if e.get("status") == "published"]
    votes = fetch_votes()

    vote_counts = {}
    for v in votes:
        name = v.get("artist_name")
        if not name:
            continue
        vote_counts[name] = vote_counts.get(name, 0) + 1

    top_artist = max(vote_counts, key=vote_counts.get) if vote_counts else "your favorite artist"
    next_event = events[0] if events else None

    today = dt.date.today().isoformat()
    plan = {
        "generated_at": today,
        "top_artist": top_artist,
        "posts": [
            {
                "platform": "IG",
                "type": "Event teaser",
                "caption": f"Caracas Unplugged returns. {next_event['title'] if next_event else 'Next show'} drops soon. Doors 7, show 8. 🔥",
                "hashtags": ["#QueenCitySoundboard", "#LatinMusic", "#CovingtonKY"],
            },
            {
                "platform": "TikTok",
                "type": "Behind the scenes",
                "caption": "Soundcheck clips + venue glow. Show the vibe in 7 seconds.",
                "hashtags": ["#LiveMusic", "#NightMode", "#CincinnatiEvents"],
            },
            {
                "platform": "X",
                "type": "Poll update",
                "caption": f"Fan vote check: {top_artist} is leading. Keep voting on the site.",
                "hashtags": ["#LatAm", "#LiveMusic"],
            },
            {
                "platform": "IG",
                "type": "Merch highlight",
                "caption": "New QCS merch drop is live. Limited pieces, no restock.",
                "hashtags": ["#MerchDrop", "#QCS"],
            },
            {
                "platform": "X",
                "type": "Countdown",
                "caption": "Countdown to the next sold-out night. Tickets in bio.",
                "hashtags": ["#TicketTailor", "#LiveEvents"],
            },
        ],
    }

    out_path = Path("/Users/pc/.openclaw/workspace/queencity-soundboard/docs/social-weekly-plan.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(plan, indent=2))

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
