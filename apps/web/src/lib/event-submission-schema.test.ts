import { describe, expect, it } from "vitest";
import { eventSubmissionSchema } from "@/lib/event-submission-schema";

describe("eventSubmissionSchema", () => {
  const baseSubmission = {
    title: "Local show",
    submitterEmail: "fan@example.com",
  };

  it.each(["alternative", "rnb", "folk", "metal", "festival"])(
    "accepts the %s category",
    (category) => {
      expect(eventSubmissionSchema.safeParse({ ...baseSubmission, category }).success).toBe(true);
    },
  );

  it("rejects categories outside the supported taxonomy", () => {
    expect(eventSubmissionSchema.safeParse({ ...baseSubmission, category: "miscellaneous" }).success).toBe(false);
  });
});