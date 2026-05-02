type NtfyPriority = "min" | "low" | "default" | "high" | "max";

type ErrorNotificationContext = {
  source?: string;
  request?: {
    method?: string;
    path?: string;
  };
  details?: Record<string, unknown>;
};

const DEFAULT_NTFY_URL = "https://notify.hurley.io/alerts";
const MAX_BODY_LENGTH = 4000;

function getNtfyUrl() {
  const configuredUrl = process.env.NTFY_ALERTS_URL || process.env.NTFY_URL;
  if (configuredUrl === "off" || configuredUrl === "disabled") return null;
  return configuredUrl || DEFAULT_NTFY_URL;
}

function stringifyValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatNotificationBody(error: unknown, context: ErrorNotificationContext = {}) {
  const lines = [
    `Service: ${process.env.NTFY_SERVICE_NAME || "recipeez"}`,
    `Environment: ${process.env.NODE_ENV || "unknown"}`
  ];

  if (context.source) lines.push(`Source: ${context.source}`);
  if (context.request?.method || context.request?.path) {
    lines.push(`Request: ${context.request.method || "UNKNOWN"} ${context.request.path || "unknown path"}`);
  }
  if (context.details && Object.keys(context.details).length > 0) {
    lines.push(`Details: ${stringifyValue(context.details)}`);
  }

  lines.push("", stringifyValue(error));

  const body = lines.join("\n");
  return body.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH)}\n...truncated` : body;
}

export async function sendErrorNotification(
  error: unknown,
  context: ErrorNotificationContext = {}
): Promise<boolean> {
  const url = getNtfyUrl();
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Title: process.env.NTFY_ALERTS_TITLE || "Recipeez Error",
        Priority: (process.env.NTFY_ALERTS_PRIORITY as NtfyPriority | undefined) || "high",
        Tags: process.env.NTFY_ALERTS_TAGS || "error,warning,recipeez"
      },
      body: formatNotificationBody(error, context)
    });

    return response.ok;
  } catch {
    return false;
  }
}
