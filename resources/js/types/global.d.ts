import type { route as routeFn } from 'ziggy-js';
import type { Auth } from '@/types/auth';

declare global {
    const route: typeof routeFn;
    interface Window {
        route: typeof routeFn;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash: {
                success?: string | null;
                error?: string | null;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
