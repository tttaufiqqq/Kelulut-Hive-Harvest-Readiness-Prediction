import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { AlertError } from '@/components/core/feedback/alert-error';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { useClipboard } from '@/hooks/use-clipboard';
import type { UiError } from '@/types';

export interface SetupStepProps {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: UiError[];
}

export function SetupStep({ qrCodeSvg, manualSetupKey, buttonText, onNextStep, errors }: SetupStepProps) {
    const { resolvedAppearance } = useAppearance();
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    return (
        <>
            {errors?.length ? (
                <AlertError errors={errors.map((error) => (error.reason ? `${error.message} ${error.reason}` : error.message))} />
            ) : (
                <>
                    <div className="mx-auto flex max-w-md overflow-hidden">
                        <div className="mx-auto aspect-square w-64 rounded-lg border border-yellow-200">
                            <div className="z-10 flex h-full w-full items-center justify-center p-5">
                                {qrCodeSvg ? (
                                    <div
                                        className="aspect-square w-full rounded-lg bg-white p-2 [&_svg]:size-full"
                                        dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                                        style={{ filter: resolvedAppearance === 'dark' ? 'invert(1) brightness(1.5)' : undefined }}
                                    />
                                ) : (
                                    <Spinner />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full space-x-5">
                        <Button variant="primary" className="w-full" onClick={onNextStep}>
                            {buttonText}
                        </Button>
                    </div>

                    <div className="relative flex w-full items-center justify-center">
                        <div className="absolute inset-0 top-1/2 h-px w-full bg-yellow-200" />
                        <span className="relative bg-white px-2 py-1 text-sm text-amber-900/50">or, enter the code manually</span>
                    </div>

                    <div className="flex w-full space-x-2">
                        <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-yellow-200">
                            {!manualSetupKey ? (
                                <div className="flex h-full w-full items-center justify-center bg-yellow-50 p-3">
                                    <Spinner />
                                </div>
                            ) : (
                                <>
                                    <input type="text" readOnly value={manualSetupKey} className="h-full w-full bg-yellow-50/50 p-3 text-sm text-amber-900 outline-none" />
                                    <button onClick={() => copy(manualSetupKey)} className="border-l border-yellow-200 px-3 transition-colors hover:bg-yellow-100">
                                        <IconComponent className="w-4 text-amber-900/60" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
