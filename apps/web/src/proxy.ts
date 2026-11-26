import { type NextRequest, NextResponse } from "next/server";
import { cleanSubId } from "@/lib/affiliate";
import { SOURCE_COOKIE } from "@/lib/click-source";

/**
 * Case study #10: remember where a visitor came from for 7 days, so a Buy click on any page
 * (via /go/[id]) can carry it to Impact as subId3. Accepts ?src=, ?ref= or ?utm_source=,
 * e.g. /tonight?src=tiktok or /events/<id>?src=qcs-tt-20261029-fightingside.
 */
export function proxy(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const source = cleanSubId(params.get("src") ?? params.get("ref") ?? params.get("utm_source"));
  const response = NextResponse.next();
  if (source) {
    response.cookies.set(SOURCE_COOKIE, source, {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      path: "/",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  // Pages only: skip API routes, /go (it reads ?src itself), Next internals and static files.
  matcher: ["/((?!api/|go/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
