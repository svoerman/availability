declare module 'swagger-ui-dist/swagger-ui-bundle' {
  interface SwaggerSpec {
    openapi?: string;
    info?: {
      title?: string;
      version?: string;
      description?: string;
    };
    paths?: Record<string, Record<string, unknown>>;
    components?: Record<string, unknown>;
  }

  interface SwaggerUIConfig {
    dom_id?: string;
    url?: string;
    spec?: SwaggerSpec;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    defaultModelRendering?: 'example' | 'model';
    displayRequestDuration?: boolean;
    docExpansion?: 'list' | 'full' | 'none';
    deepLinking?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    operationsSorter?: 'alpha' | 'method' | ((a: Record<string, unknown>, b: Record<string, unknown>) => number);
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tagsSorter?: 'alpha' | ((a: Record<string, unknown>, b: Record<string, unknown>) => number);
    onComplete?: () => void;
    syntaxHighlight?: {
      activated?: boolean;
      theme?: string;
    };
  }

  interface SwaggerUIInstance {
    specActions: {
      updateUrl: (url: string) => void;
      updateJsonSpec: (spec: SwaggerSpec) => void;
    };
  }

  interface SwaggerUIConstructor {
    (config?: SwaggerUIConfig): SwaggerUIInstance;
    presets: {
      apis: unknown[];
    };
    SwaggerUIStandalonePreset: unknown;
  }

  const SwaggerUIBundle: SwaggerUIConstructor;
  export = SwaggerUIBundle;
}
