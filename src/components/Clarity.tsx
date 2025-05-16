'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    clarity: (command: string, ...args: any[]) => void;
  }
}

const CLARITY_PROJECT_ID = 'r1xvdk63by';

export default function Clarity() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'pageview');
    }
  }, [pathname]);

  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  );
}
