// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    dsn: 'https://2d0151c02f124a86801351fe4bf36d5e@o4505183298977792.ingest.sentry.io/4505183301009408',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
});
