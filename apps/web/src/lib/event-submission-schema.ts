import { z } from "zod";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artistName: z.string().trim().max(200).optional(),
  venueName: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().optional(),
  category: z.enum(EVENT_CATEGORIES).or(z.literal("")).optional(),
  description: z.string().trim().max(2000).optional(),
  ticketUrl: z.string().trim().url().optional().or(z.literal("")),
  submitterName: z.string().trim().max(200).optional(),
  submitterEmail: z.string().trim().email(),
});