import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ScrollArea } from '@/components/core/scroll-area';
import { ThesisModal } from '@/components/core/thesis-modal';
import type { Auth } from '@/types';
import { BrutalistGridSection } from './LandingPage/BrutalistGridSection';
import { FooterSection } from './LandingPage/FooterSection';
import { HeroSection } from './LandingPage/HeroSection';
import { SustainabilitySection } from './LandingPage/SustainabilitySection';

type Props = { thesisUrl?: string | null };

export default function LandingPage({ thesisUrl }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const dashboardHref = auth?.user?.role === 'admin' ? '/admin' : '/dashboard';
    const [showThesis, setShowThesis] = useState(false);

    const hasThesis = !!thesisUrl;

    function handleReadResearch() {
        if (thesisUrl) setShowThesis(true);
    }

    return (
        <ScrollArea className="h-screen bg-[#FFFBEB]">
            <HeroSection
                dashboardHref={dashboardHref}
                hasThesis={hasThesis}
                onReadResearch={handleReadResearch}
            />
            <BrutalistGridSection />
            <SustainabilitySection />

            {thesisUrl && (
                <ThesisModal
                    isOpen={showThesis}
                    onClose={() => setShowThesis(false)}
                    thesisUrl={thesisUrl}
                />
            )}

            <FooterSection
                dashboardHref={dashboardHref}
                hasThesis={hasThesis}
                onReadResearch={handleReadResearch}
            />
        </ScrollArea>
    );
}
