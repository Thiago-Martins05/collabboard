import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Before send hook to filter out certain errors
  beforeSend(event, hint) {
    // Don't send errors from localhost in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    // Filter out certain error types
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.type === "PrismaClientKnownRequestError") {
        // Don't send database constraint errors
        if (exception.value?.includes("Unique constraint")) {
          return null;
        }
      }
    }

    return event;
  },

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // Add user context when available
  beforeSendTransaction(event) {
    // Add user context if available
    if (event.contexts?.user) {
      event.user = event.contexts.user;
    }
    return event;
  },
});
