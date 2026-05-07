import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { BeeIcon } from '@/components/core/bee-icon';
import { Button } from '@/components/core/button';
import { TextLink } from '@/components/core/text-link';

type AppErrorBoundaryProps = {
    children: React.ReactNode;
    requestId?: string | null;
};

type AppErrorBoundaryState = {
    hasError: boolean;
};

export class AppErrorBoundary extends React.Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    public state: AppErrorBoundaryState = {
        hasError: false,
    };

    public static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    public componentDidCatch(error: Error): void {
        console.error(error);
    }

    public render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const requestId =
            this.props.requestId ??
            (typeof window !== 'undefined'
                ? window.__BUZZYHIVE_REQUEST_ID ?? null
                : null);

        return (
            <div className="flex min-h-screen flex-col bg-[#FFFBEB] font-sans text-amber-950">
                <header className="border-b border-yellow-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center gap-2">
                        <div className="rounded-xl bg-yellow-400 p-2">
                            <BeeIcon className="h-6 w-6 text-yellow-950" />
                        </div>
                        <span className="hidden text-xl font-bold tracking-tight text-amber-900 sm:block">
                            BuzzyHive 2.0
                        </span>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-[2rem] border border-yellow-100 bg-white/90 p-8 text-center shadow-[0_24px_64px_-48px_rgba(120,53,15,0.45)]">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-amber-900">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-semibold text-amber-950">
                            Something interrupted this page
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-amber-800/70">
                            We could not finish rendering this page.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-amber-800/60">
                            A page component threw an unexpected client-side
                            error while the interface was loading. Please
                            refresh and try again.
                        </p>

                        {requestId && (
                            <p className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-xs text-amber-900/70">
                                Reference ID: <span className="font-semibold">{requestId}</span>
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => window.location.reload()}
                                className="gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:bg-yellow-300"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh Page
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => window.location.assign('/')}
                                className="gap-2 rounded-xl border border-yellow-300 px-5 py-3 text-sm font-semibold text-amber-800 hover:bg-yellow-100 hover:text-amber-800"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </div>

                        <div className="mt-6 border-t border-amber-100 pt-5">
                            <TextLink
                                href="mailto:support@buzzyhive.com"
                                className="text-sm text-amber-800/60 no-underline transition-colors hover:text-amber-800"
                            >
                                Contact Support
                            </TextLink>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
}
