"use client";

import { track } from "@vercel/analytics";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  event: string;
  label?: string;
  properties?: Record<string, string | number | boolean | null>;
  children: ReactNode;
  className?: string;
};

function sanitizeExternalHref(href: string): string {
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

export default function TrackedExternalLink({ href, event, label, properties, children, className, ...rest }: Props) {
  const safeHref = sanitizeExternalHref(href);

  return (
    <a
      href={safeHref}
      className={className}
      onClick={() => track(event, { ...properties, label: label ?? safeHref })}
      {...rest}
    >
      {children}
    </a>
  );
}
