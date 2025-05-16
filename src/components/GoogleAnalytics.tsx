'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        gtag: (command: string, ...args: (string | object)[]) => void;
    }
}

const GA_MEASUREMENT_ID = 'G-8Y5C3BG8PC'; // Reemplaza con tu ID

export function GoogleAnalytics() {
    const pathname = usePathname();

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !GA_MEASUREMENT_ID) return;

        const handleRouteChange = (url: string) => {
            if (typeof window.gtag === 'function') {
                window.gtag('config', GA_MEASUREMENT_ID, {
                    page_path: url,
                });
            }
        };

        handleRouteChange(pathname);
    }, [pathname]);

    return (
        <>
            {/* Script de carga de gtag */}
            <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            {/* Inicialización */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
                }}
            />
        </>
    );
}
