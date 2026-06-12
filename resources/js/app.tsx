import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { route } from 'ziggy-js';
import '../css/app.css';
import { AppErrorBoundary } from '@/components/core/feedback/app-error-boundary';
import { initializeTheme } from '@/hooks/use-appearance';

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
const pusherScheme = import.meta.env.VITE_PUSHER_SCHEME ?? 'https';
const pusherHost = import.meta.env.VITE_PUSHER_HOST;
const pusherPort = Number(
    import.meta.env.VITE_PUSHER_PORT ??
        (pusherScheme === 'https' ? '443' : '80'),
);

configureEcho(
    pusherKey && pusherCluster
        ? {
              broadcaster: 'pusher',
              key: pusherKey,
              cluster: pusherCluster,
              forceTLS: pusherScheme === 'https',
              enabledTransports: ['ws', 'wss'],
              ...(pusherHost ? { wsHost: pusherHost } : {}),
              ...(Number.isNaN(pusherPort)
                  ? {}
                  : { wsPort: pusherPort, wssPort: pusherPort }),
          }
        : {
              broadcaster: 'null',
          },
);

window.route = route;

const appName = import.meta.env.VITE_APP_NAME || 'BuzzyHive 2.0';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const requestId =
            props.initialPage.props.meta?.request_id?.toString() ?? null;

        window.__BUZZYHIVE_REQUEST_ID = requestId;

        root.render(
            <StrictMode>
                <AppErrorBoundary requestId={requestId}>
                    <App {...props} />
                </AppErrorBoundary>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
