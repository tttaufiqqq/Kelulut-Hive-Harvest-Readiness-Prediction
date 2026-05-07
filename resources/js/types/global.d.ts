import type { route as routeFn } from 'ziggy-js';
import type { Auth } from '@/types/auth';

declare global {
    const route: typeof routeFn;
    interface Window {
        route: typeof routeFn;
        __BUZZYHIVE_REQUEST_ID?: string | null;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash: {
                id?: string | null;
                success?: string | null;
                error?: string | null;
                warning?: string | null;
            };
            meta: {
                request_id?: string | null;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
