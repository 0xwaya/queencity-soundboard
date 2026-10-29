"use client";

import { track } from "@vercel/analytics";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { readClientSource } from "@/lib/click-source";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  event: string;
  label?: string;
  /** Extra analytics properties. When set, the captured traffic source is added as `source`. */
  trackProps?: Record<string, string>;
  children: ReactNode;
  className?: string;
};

function sanitizeExternalHref(href: string): string {
  // Same-site paths such as /go/<id> are allowed; protocol-relative URLs are not.
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}

export default function TrackedExternalLink({ href, event, label, trackProps, children, className, ...rest }: Props) {
  const safeHref = sanitizeExternalHref(href);

  return (
    <a
      href={safeHref}
      className={className}
      onClick={() =>
        track(event, trackProps ? { ...trackProps, source: readClientSource() } : { label: label ?? safeHref })
      }
      {...rest}
    >
      {children}
    </a>
  );
}
