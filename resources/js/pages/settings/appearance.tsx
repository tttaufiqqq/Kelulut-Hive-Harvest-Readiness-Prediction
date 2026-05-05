import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';
import { Card } from '@/components/core/card';
import { AppearanceToggleTab } from '@/components/settings/appearance-tabs';
import { Heading } from '@/components/settings/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { SettingsLayout } from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <AuthenticatedLayout>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <SettingsLayout>
                <Card>
                    <div className="space-y-4">
                        <Heading
                            variant="small"
                            title="Appearance"
                            description="Theme and display preferences"
                        />
                        <AppearanceToggleTab />
                        <Alert className="rounded-2xl border-yellow-100 bg-yellow-50 text-amber-900">
                            <div className="mt-0.5 rounded-xl bg-yellow-200 p-2.5">
                                <Palette className="h-4 w-4 text-amber-700" />
                            </div>
                            <AlertTitle className="text-sm font-semibold text-amber-900">
                                Theme customization is disabled
                            </AlertTitle>
                            <AlertDescription className="mt-0.5 text-sm text-amber-600/60">
                                <p>
                                    BuzzyHive uses a fixed theme to ensure the
                                    best experience. Custom themes are not
                                    available at this time.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </div>
                </Card>
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
