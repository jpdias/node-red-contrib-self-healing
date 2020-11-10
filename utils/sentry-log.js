let SENTRY_DSN = "";
try {
  require("dotenv").config({ path: __dirname + "/../.env" });
  SENTRY_DSN = process.env.SENTRY_DSN;
} catch (e) {
  SENTRY_DSN = "";
}

let Sentry = null;
try {
  Sentry = require("@sentry/node");
} catch (e) {
  Sentry = null;
}

if (Sentry) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

class SentryLog {
  static sendMessage(msg) {
    if (Sentry) {
      Sentry.captureMessage(msg);
    }
  }
  static sendError(error) {
    if (Sentry) {
      Sentry.captureError(error);
    }
  }
}

module.exports = SentryLog;
