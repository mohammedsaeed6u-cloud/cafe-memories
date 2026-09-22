'use client';

import React from 'react';
import { withUtm, UtmParams } from '@/lib/utils/utm';

interface OutboundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  utmParams?: UtmParams;
  children: React.ReactNode;
}

export function OutboundLink({
  href,
  utmParams,
  children,
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer',
  ...rest
}: OutboundLinkProps) {
  const trackedHref = withUtm(href, utmParams);

  return (
    <a
      href={trackedHref}
      target={target}
      rel={rel}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
