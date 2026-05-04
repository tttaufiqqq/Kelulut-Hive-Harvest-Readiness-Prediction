import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';
import { Card } from '@/components/core/card';
import { Heading } from '@/components/settings/heading';
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
                        <div className="flex items-start gap-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
                            <div className="mt-0.5 rounded-xl bg-yellow-200 p-2.5">
                                <Palette className="h-4 w-4 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-900">
                                    Theme customization is disabled
                                </p>
                                <p className="mt-0.5 text-sm text-amber-600/60">
                                    BuzzyHive uses a fixed theme to ensure the
                                    best experience. Custom themes are not
                                    available at this time.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
