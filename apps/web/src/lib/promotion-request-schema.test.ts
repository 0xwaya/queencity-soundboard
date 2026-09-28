import { describe, expect, it } from "vitest";
import { parseBudgetToCents, promotionRequestSchema } from "@/lib/promotion-request-schema";

const validRequest = {
  organization: "Taft Theatre",
  contactEmail: "booking@example.com",
  package: "spotlight" as const,
};

describe("promotionRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    expect(promotionRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("requires organization, email and a known package", () => {
    expect(promotionRequestSchema.safeParse({ ...validRequest, organization: "" }).success).toBe(false);
    expect(promotionRequestSchema.safeParse({ ...validRequest, contactEmail: "not-an-email" }).success).toBe(false);
    expect(promotionRequestSchema.safeParse({ ...validRequest, package: "free-forever" }).success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = promotionRequestSchema.safeParse({
      ...validRequest,
      preferredStart: "2026-10-10",
      preferredEnd: "2026-10-01",
    });
    expect(result.success).toBe(false);
  });

  it("allows an equal start and end date", () => {
    const result = promotionRequestSchema.safeParse({
      ...validRequest,
      preferredStart: "2026-10-10",
      preferredEnd: "2026-10-10",
    });
    expect(result.success).toBe(true);
  });
});

describe("parseBudgetToCents", () => {
  it("parses plain and formatted amounts", () => {
    expect(parseBudgetToCents("500")).toBe(50000);
    expect(parseBudgetToCents("$750.50")).toBe(75050);
  });

  it("returns null when there is no usable amount", () => {
    expect(parseBudgetToCents("")).toBeNull();
    expect(parseBudgetToCents(undefined)).toBeNull();
    expect(parseBudgetToCents("let's talk")).toBeNull();
  });
});
