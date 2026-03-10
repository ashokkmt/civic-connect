"use client";

import { useEffect, useState } from "react";
import "./swagger-theme.css";

declare global {
  interface SwaggerUIBundleFn {
    (config: Record<string, unknown>): unknown;
    presets: {
      apis: unknown;
    };
  }

  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleFn;
    SwaggerUIStandalonePreset?: unknown;
    ui?: unknown;
  }
}

const SWAGGER_CSS_ID = "swagger-ui-css";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    });
    document.body.appendChild(script);
  });
}

export default function ApiDocsPage() {
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const css = document.getElementById(SWAGGER_CSS_ID) as HTMLLinkElement | null;
    if (!css) {
      const link = document.createElement("link");
      link.id = SWAGGER_CSS_ID;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
      document.head.appendChild(link);
    }

    const init = async () => {
      try {
        setLoadError(null);
        await loadScript("https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js");
        await loadScript("https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js");

        if (cancelled || !window.SwaggerUIBundle) {
          return;
        }

        window.ui = window.SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          displayRequestDuration: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
        });
      } catch {
        setLoadError("Unable to load Swagger UI assets.");
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="api-docs-theme relative w-full overflow-hidden px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute bottom-0 right-8 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <section className="relative mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-6 shadow-sm backdrop-blur md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Developer Portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Interactive API Docs</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
            Explore endpoints, inspect schemas, and send test requests directly from this page.
            This documentation is powered by the live OpenAPI definition at /openapi.yaml.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {loadError}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg md:p-3">
          <div id="swagger-ui" className="swagger-shell min-h-[calc(100vh-13rem)] w-full overflow-hidden rounded-xl" />
        </div>
      </section>

    </main>
  );
}
