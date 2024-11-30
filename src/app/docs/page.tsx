'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    SwaggerUIBundle: any;
  }
}

export default function ApiDoc() {
  const swaggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
      const ui = window.SwaggerUIBundle({
        url: '/api/docs',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
      });
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
            window.SwaggerUIBundle({
              url: '/api/docs',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                window.SwaggerUIBundle.presets.apis,
                window.SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
            });
          }
        }}
      />
      <div id="swagger-ui" ref={swaggerRef} />
    </div>
  );
}
