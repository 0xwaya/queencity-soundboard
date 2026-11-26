"""Rule checks for tools/social_agent.py. Run: python3 -m unittest discover -s tools -v (stdlib only)."""
import datetime as dt
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import social_agent as sa  # noqa: E402

TODAY = dt.date(2026, 11, 25)  # Wed; event day = Fri Nov 27


def ev(artist, category="jazz", hour=19, minute=30, day=27, desc=None, status="published", **kw):
    start = dt.datetime(2026, 11, day, hour, minute, tzinfo=sa.ET).astimezone(dt.timezone.utc)
    return {
        "title": artist, "artist_name": artist, "event_date": start.isoformat(), "category": category,
        "status": status, "description": desc,
        "venues": {"name": "Ludlow Garage", "address": "342 Ludlow Ave", "city": "Cincinnati", "state": "OH"},
        **kw,
    }


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.ledger = sa.Ledger(Path(self.tmp.name) / "ledger.json")


class CaptionTests(Base):
    def test_matches_playbook_template(self):
        e = ev("Marion Meadows", desc="Doors 6:00 PM, all ages")
        cap, notes = sa.build_caption(e, sa._start_et(e))
        lines = cap.split("\n")
        self.assertEqual(lines[0], "THIS FRIDAY: Marion Meadows")
        self.assertEqual(lines[1], "📍 Ludlow Garage, 342 Ludlow Ave, Cincinnati, OH")
        self.assertEqual(lines[2], "🗓 Fri, Nov 27 · 7:30 PM ET (doors 6:00 PM / show 7:30 PM)")
        self.assertEqual(lines[3], "🎟 Tickets at the link in bio")
        self.assertEqual(lines[4], "More Cincy + NKY shows on Queen City Soundboard")
        self.assertEqual(lines[6], "Ref: qcs-tt-20261127-marionmeadows")
        self.assertEqual(sa.validate_caption(cap), [])
        self.assertEqual(notes, [])

    def test_unknown_doors_is_flagged_not_invented(self):
        e = ev("Marion Meadows")
        cap, notes = sa.build_caption(e, sa._start_et(e))
        self.assertIn("doors TBA", cap)
        self.assertTrue(any("doors" in n for n in notes))

    def test_parse_doors(self):
        self.assertEqual(sa.parse_doors("Doors at 7pm"), "7:00 PM")
        self.assertEqual(sa.parse_doors("doors 6:30 p.m."), "6:30 PM")
        self.assertIsNone(sa.parse_doors("Doors 7"))


class HashtagTests(unittest.TestCase):
    def test_forbidden_tag_stripped_in_every_case(self):
        for bad in ("#QueenCitySoundboard", "#queencitysoundboard", "#Queen_City_Soundboard"):
            tags = sa.sanitize_hashtags([bad, "#cincinnati", "#cincy", "#nky", "#jazz", "#livemusic"])
            self.assertNotIn("queencitysoundboard", [sa._tag_key(t) for t in tags])

    def test_count_is_5_to_7(self):
        self.assertEqual(len(sa.sanitize_hashtags([])), sa.HASHTAGS_MIN)
        many = sa.sanitize_hashtags([f"#tag{i}" for i in range(20)])
        self.assertEqual(len(many), sa.HASHTAGS_MAX)

    def test_defaults_are_broad_and_valid_for_all_categories(self):
        for cat in sa.GENRE_HASHTAGS:
            tags = sa.default_hashtags(cat)
            self.assertTrue(sa.HASHTAGS_MIN <= len(tags) <= sa.HASHTAGS_MAX, cat)
            self.assertTrue({"#cincinnati", "#cincy", "#nky"} <= set(tags), cat)

    def test_guard_strips_generated_caption_text(self):
        out = sa.strip_forbidden_hashtags("Great night #QueenCitySoundboard #cincy")
        self.assertNotIn("QueenCitySoundboard", out)
        self.assertIn("#cincy", out)

    def test_guard_applies_to_event_supplied_hashtags(self):
        e = ev("Act", hashtags=["#QueenCitySoundboard", "#jazz"])
        cap, _ = sa.build_caption(e, sa._start_et(e))
        self.assertNotIn("#QueenCitySoundboard", cap)
        self.assertEqual(sa.validate_caption(cap), [])

    def test_validate_rejects_forbidden_tag(self):
        e = ev("Act")
        cap, _ = sa.build_caption(e, sa._start_et(e))
        bad = cap.replace("#cincy", "#QueenCitySoundboard", 1)
        self.assertTrue(sa.validate_caption(bad))


class SelectionTests(Base):
    def test_cap_priority_and_bengals(self):
        events = [
            ev("Sports Game", "sports", 13), ev("Gallery Night", "community", 18),
            ev("Funny Person", "comedy", 20), ev("Band A", "rock", 21), ev("Band B", "country", 20),
            ev("Cincinnati Bengals vs Foo", "sports", 20, title="Cincinnati Bengals vs Foo"),
            ev("Draft Act", "rock", status="draft"),
        ]
        plan = sa.build_plan(events, TODAY, ledger=self.ledger)
        acts = [p["act"] for p in plan["posts"]]
        self.assertEqual(len(acts), sa.POSTS_PER_DAY_MAX)
        self.assertEqual(acts[0], "Cincinnati Bengals vs Foo")
        self.assertTrue(plan["posts"][0]["animated"])
        self.assertEqual(acts[1:], ["Band B", "Band A"])  # music before comedy/arts/sports
        self.assertNotIn("Draft Act", acts)
        self.assertEqual(sum(p["animated"] for p in plan["posts"]), 1)

    def test_priority_order_without_bengals(self):
        events = [ev("S", "sports"), ev("A", "community"), ev("C", "comedy"), ev("M", "jazz")]
        plan = sa.build_plan(events, TODAY, ledger=self.ledger)
        self.assertEqual([p["act"] for p in plan["posts"]], ["M", "C", "A"])

    def test_ledger_prevents_duplicates_and_counts_today(self):
        self.ledger.record("qcs-tt-20261127-banda", TODAY, "x")
        plan = sa.build_plan([ev("Band A", "rock"), ev("Band B", "rock", 20)], TODAY, ledger=self.ledger)
        self.assertEqual([p["act"] for p in plan["posts"]], ["Band B"])
        self.assertEqual(plan["skipped"][0]["reason"], "already posted (ledger)")
        self.assertEqual(plan["slots_left_today"], 2)

    def test_plan_is_dry_run_tiktok_only_with_ai_label(self):
        plan = sa.build_plan([ev("Band A", "rock")], TODAY, ledger=self.ledger)
        self.assertTrue(plan["dry_run"])
        for p in plan["posts"]:
            self.assertEqual(p["channel"], "tiktok")
            self.assertTrue(p["ai_generated_label"])
            self.assertEqual(p["caption_problems"], [])

    def test_ledger_stays_untouched_by_plan(self):
        sa.build_plan([ev("Band A", "rock")], TODAY, ledger=self.ledger)
        self.assertFalse(self.ledger.path.exists())

    def test_bengals_games_from_espn_shape(self):
        data = {"events": [{"name": "Foo at Cincinnati Bengals", "date": "2026-11-27T18:00Z",
                            "competitions": [{"venue": {"fullName": "Paycor Stadium",
                                                        "address": {"city": "Cincinnati", "state": "OH"}}}]}]}
        games = sa.bengals_games(dt.date(2026, 11, 27), lambda _u: data)
        self.assertEqual(len(games), 1)
        self.assertTrue(sa.is_bengals(games[0]))
        self.assertEqual(sa.bengals_games(dt.date(2026, 11, 28), lambda _u: data), [])


class ArtTests(Base):
    def test_no_repeat_of_previous_two_days(self):
        yday = TODAY - dt.timedelta(days=1)
        first = sa.SUBJECT_POOL["jazz"][0]
        self.ledger.record("qcs-tt-20261126-x", yday, first)
        self.ledger.record("qcs-tt-20261125-y", TODAY - dt.timedelta(days=2), sa.SUBJECT_POOL["jazz"][1])
        plan = sa.build_plan([ev("Jazz Act", "jazz")], TODAY, ledger=self.ledger)
        self.assertEqual(plan["posts"][0]["central_subject"], sa.SUBJECT_POOL["jazz"][2])

    def test_three_day_old_subject_may_repeat(self):
        self.ledger.record("qcs-tt-old", TODAY - dt.timedelta(days=3), sa.SUBJECT_POOL["jazz"][0])
        plan = sa.build_plan([ev("Jazz Act", "jazz")], TODAY, ledger=self.ledger)
        self.assertEqual(plan["posts"][0]["central_subject"], sa.SUBJECT_POOL["jazz"][0])

    def test_pool_subjects_never_instruments(self):
        for cat, pool in sa.SUBJECT_POOL.items():
            for s in pool:
                self.assertEqual(sa.validate_art(s, [], set()), [], (cat, s))

    def test_instrument_and_guitar_limits(self):
        self.assertTrue(sa.validate_art("a red electric guitar", [], set()))
        self.assertEqual(sa.validate_art("a red electric guitar", [], set(), allow_instrument=True), [])
        self.assertTrue(sa.validate_art("a vintage guitar", ["a red electric guitar"], set(), allow_instrument=True))

    def test_brief_forbids_code_drawn_art(self):
        self.assertIn("never drawn in code", sa.art_brief("Act", "rock", "x"))


class ChannelTests(unittest.TestCase):
    def test_only_tiktok_allowed(self):
        sa.require_channel("tiktok")
        for ch in ("instagram", "IG", "facebook", "stories", "reels", "x"):
            with self.assertRaises(sa.ChannelDisabledError):
                sa.require_channel(ch)

    def test_flags_are_off(self):
        self.assertFalse(sa.INSTAGRAM_AUTOMATION_ENABLED)
        self.assertFalse(sa.FACEBOOK_ENABLED)
        self.assertFalse(sa.STORIES_AUTOMATION_ENABLED)


class TruncationTests(unittest.TestCase):
    def test_truncated_caption_surfaces_full_text(self):
        full = "THIS FRIDAY: Act\n📍 V, A\nRef: qcs-tt-20261127-act"
        sa.check_posted_caption("r", full, full)
        with self.assertRaises(sa.TruncatedCaptionError) as cm:
            sa.check_posted_caption("r", full, full[:20])
        self.assertEqual(cm.exception.full_caption, full)


if __name__ == "__main__":
    unittest.main()
