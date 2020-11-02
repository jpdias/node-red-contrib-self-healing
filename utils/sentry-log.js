require('dotenv').config({path: __dirname + '/../.env'})
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

module.exports = Sentry;