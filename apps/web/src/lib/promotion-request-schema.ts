import { z } from "zod";

export const PROMOTION_PACKAGES = ["spotlight", "featured_week", "homepage_takeover", "custom"] as const;

export type PromotionPackage = (typeof PROMOTION_PACKAGES)[number];

export const PROMOTION_PACKAGE_LABELS: Record<PromotionPackage, string> = {
  spotlight: "Ticket Spotlight — homepage feature",
  featured_week: "Featured Week — priority placement in the calendar",
  homepage_takeover: "Homepage Takeover — hero + spotlight",
  custom: "Something else / not sure yet",
};

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(""));

export const promotionRequestSchema = z
  .object({
    organization: z.string().trim().min(1).max(200),
    eventTitle: z.string().trim().max(200).optional(),
    contactName: z.string().trim().max(200).optional(),
    contactEmail: z.string().trim().email(),
    contactPhone: z.string().trim().max(40).optional(),
    package: z.enum(PROMOTION_PACKAGES),
    preferredStart: optionalDate,
    preferredEnd: optionalDate,
    budget: z.string().trim().max(20).optional(),
    message: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) => !value.preferredStart || !value.preferredEnd || value.preferredEnd >= value.preferredStart,
    { message: "End date must be on or after the start date", path: ["preferredEnd"] },
  );

export type PromotionRequestInput = z.infer<typeof promotionRequestSchema>;

/** Accepts "750", "$750", "750.50" and returns whole cents, or null when unparseable. */
export function parseBudgetToCents(budget?: string): number | null {
  if (!budget) return null;
  const digits = budget.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const amount = Number.parseFloat(digits);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
