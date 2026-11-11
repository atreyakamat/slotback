import type { Instrumentation } from "next";

/**
 * Logs every server error as one JSON line, so Netlify's function logs can be searched and
 * alerted on without a paid monitoring service. No request bodies, cookies or query strings.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      message: err.message,
      digest: err.digest,
      path: request.path.split("?")[0],
      method: request.method,
      route: context.routePath,
      type: context.routeType,
      at: new Date().toISOString(),
    }),
  );
};
