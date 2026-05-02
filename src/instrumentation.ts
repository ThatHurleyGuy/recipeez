import type { Instrumentation } from "next";
import { sendErrorNotification } from "@/lib/errorNotifications";

const originalConsoleError = console.error.bind(console);
let consolePatched = false;
let processHandlersRegistered = false;

function notify(error: unknown, source: string) {
  void sendErrorNotification(error, { source });
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (!consolePatched) {
    consolePatched = true;
    console.error = (...args: unknown[]) => {
      originalConsoleError(...args);
      notify(args.length === 1 ? args[0] : args, "console.error");
    };
  }

  if (!processHandlersRegistered) {
    processHandlersRegistered = true;
    process.on("uncaughtExceptionMonitor", (error) => {
      notify(error, "uncaughtExceptionMonitor");
    });
    process.on("unhandledRejection", (reason) => {
      notify(reason, "unhandledRejection");
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await sendErrorNotification(error, {
    source: "next.onRequestError",
    request: {
      method: request.method,
      path: request.path
    },
    details: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason
    }
  });
};
