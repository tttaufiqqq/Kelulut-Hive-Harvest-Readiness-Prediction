import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { route } from 'ziggy-js';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';

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

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
