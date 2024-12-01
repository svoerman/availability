'use client';

import 'swagger-ui-dist/swagger-ui.css';
import { useEffect, useRef } from 'react';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';

declare global {
  interface Window {
    SwaggerUIBundle: typeof SwaggerUIBundle;
  }
}

export default function DocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (swaggerRef.current) {
      SwaggerUIBundle({
        dom_id: '#swagger-ui',
        url: '/api/swagger.json',
        deepLinking: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        syntaxHighlight: {
          activated: true,
          theme: 'agate'
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        .swagger-ui {
          margin: 0 auto;
          max-width: 1460px;
          padding: 2rem;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          font-size: 36px;
          color: #3b4151;
        }
        .swagger-ui .scheme-container {
          margin: 0;
          padding: 20px 0;
          background: none;
          box-shadow: none;
        }
        .swagger-ui .opblock {
          margin-bottom: 15px;
          border-radius: 6px;
        }
        .swagger-ui .opblock .opblock-summary {
          padding: 10px;
        }
        .swagger-ui .opblock .opblock-summary-method {
          font-size: 14px;
          font-weight: 600;
          min-width: 80px;
          text-align: center;
        }
      `}</style>
      <div id="swagger-ui" ref={swaggerRef} />
    </div>
  );
}
