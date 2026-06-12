import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { Modal } from '@/components/core/overlay/modal';
import { ReadinessBadge } from '@/components/core/readiness-chart-cards';
import type { PredictionEntry } from './types';
import { AnimatedNumber } from './AnimatedNumber';
import { PredictionWarningAlert } from './PredictionWarningAlert';
import { SensorSnapshot } from './SensorSnapshot';
import { formatCapturedTime, formatPredictionTime, formatSensorReading, getTrustLabel, getTrustStyle } from './utils';

interface PredictionThresholdModalProps {
    prediction: PredictionEntry | null;
    isOpen: boolean;
    currentIndex: number;
    totalItems: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

export function PredictionThresholdModal({ prediction, isOpen, currentIndex, totalItems, hasPrev, hasNext, onPrev, onNext, onClose }: PredictionThresholdModalProps) {
    if (!isOpen || !prediction) return null;

    return (
        <Modal isOpen onClose={onClose} title="Prediction Details" maxWidth="2xl">
            <>
                {/* Mobile layout */}
                <div className="space-y-4 sm:hidden">
                    <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" onClick={onPrev} disabled={!hasPrev} className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                            <ChevronLeft className="h-4 w-4 text-amber-900" />
                        </Button>
                        <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                            {currentIndex + 1} / {totalItems}
                        </span>
                        <Button type="button" variant="ghost" onClick={onNext} disabled={!hasNext} className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                            <ChevronRight className="h-4 w-4 text-amber-900" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Readiness</p>
                            <ReadinessBadge level={prediction.readiness_level} size="sm" className="min-w-[7.5rem] justify-center" />
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Trust</p>
                            <span className={`inline-flex min-w-[7.5rem] justify-center rounded-full px-3 py-1 text-xs font-bold ${getTrustStyle(prediction.warning_state)}`}>
                                {getTrustLabel(prediction)}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">HRI</p>
                            <p className="font-medium text-amber-950">
                                <AnimatedNumber value={prediction.hri_value * 100} suffix="%" />
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Raw Confidence</p>
                            <p className="font-medium text-amber-950">
                                <AnimatedNumber value={prediction.confidence_score * 100} suffix="%" maxFractionDigits={1} />
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Captured</p>
                            <p className="break-words font-medium text-amber-950">{formatCapturedTime(prediction)}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Prediction Time</p>
                            <p className="break-words font-medium text-amber-950">{formatPredictionTime(prediction)}</p>
                        </div>
                        <div className="col-span-2 min-w-0">
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Device</p>
                            <p className="break-words font-medium text-amber-950">{prediction.device_identifier ?? 'Unknown device'}</p>
                        </div>
                    </div>

                    <PredictionWarningAlert prediction={prediction} />

                    <div>
                        <p className="mb-2 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Sensor Snapshot</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Temp</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.temp, '°C', 1)}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Humidity</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.humidity, '%', 1)}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">MQ2</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.mq2_value)}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">MQ3</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.mq3_value)}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">MQ5</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.mq5_value)}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">MQ135</p>
                                <p className="font-medium text-amber-950">{formatSensorReading(prediction.sensor_values.mq135_value)}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>

                    <div className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="w-full">Close</Button>
                    </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden space-y-5 sm:block">
                    <div className="-mt-2 mb-0.5 flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev} className="h-9 w-9 rounded-xl p-0 text-amber-900 transition-none active:scale-100 hover:bg-yellow-100 hover:text-amber-900">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                            {currentIndex + 1} / {totalItems}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={onNext} disabled={!hasNext} className="h-9 w-9 rounded-xl p-0 text-amber-900 transition-none active:scale-100 hover:bg-yellow-100 hover:text-amber-900">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-4 lg:grid-cols-3">
                        <div>
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Readiness</p>
                            <ReadinessBadge level={prediction.readiness_level} size="sm" />
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">HRI</p>
                            <p className="font-semibold text-amber-950">
                                <AnimatedNumber value={prediction.hri_value * 100} suffix="%" />
                            </p>
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Raw Confidence</p>
                            <p className="font-semibold text-amber-950">
                                <AnimatedNumber value={prediction.confidence_score * 100} suffix="%" maxFractionDigits={1} />
                            </p>
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Trust</p>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getTrustStyle(prediction.warning_state)}`}>
                                {getTrustLabel(prediction)}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Captured</p>
                            <p className="font-medium text-amber-950">{formatCapturedTime(prediction)}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Prediction Time</p>
                            <p className="font-medium text-amber-950">{formatPredictionTime(prediction)}</p>
                        </div>
                        <div className="col-span-2 lg:col-span-3">
                            <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">Device</p>
                            <p className="font-medium text-amber-950">{prediction.device_identifier ?? 'Unknown device'}</p>
                        </div>
                    </div>

                    <PredictionWarningAlert prediction={prediction} />

                    <div>
                        <p className="mb-3 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Sensor Snapshot</p>
                        <SensorSnapshot prediction={prediction} />
                    </div>

                    <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>
                </div>
            </>
        </Modal>
    );
}
