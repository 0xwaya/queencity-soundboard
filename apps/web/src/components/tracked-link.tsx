"use client";

import Link from "next/link";
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

export default function TrackedLink({ href, event, label, properties, children, className, ...rest }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track(event, { ...properties, label: label ?? href })}
      {...rest}
    >
      {children}
    </Link>
  );
}
