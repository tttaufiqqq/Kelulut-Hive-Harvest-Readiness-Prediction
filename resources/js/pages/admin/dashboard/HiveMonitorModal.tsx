import { ChevronLeft, ChevronRight, Droplets, Thermometer, Wind } from 'lucide-react';
import { Modal } from '@/components/core/modal';
import { SensorRadarChart } from '@/components/core/visualization-charts';
import { READINESS_LABEL, STATUS_BADGE, STATUS_LABEL, WARN_CO2_ABOVE, WARN_HUMID_ABOVE, WARN_TEMP_ABOVE, type HiveData } from './constants';
import { formatLastReading } from './utils';

export interface HiveMonitorModalProps {
    hive: HiveData | null;
    isOpen: boolean;
    hasPrev: boolean;
    hasNext: boolean;
    selectedIndex: number | null;
    totalHives: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

export function HiveMonitorModal({ hive, isOpen, hasPrev, hasNext, selectedIndex, totalHives, onPrev, onNext, onClose }: HiveMonitorModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={hive?.hive_name ?? ''} maxWidth="lg">
            {hive && (() => {
                const hasMqData = hive.mq2 > 0;
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`rounded-lg px-3 py-1 text-xs font-bold ${STATUS_BADGE[hive.status]}`}>{STATUS_LABEL[hive.status]}</span>
                                <span className="text-xs text-amber-900/70">{READINESS_LABEL[hive.status]}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={onPrev} disabled={!hasPrev} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                                    <ChevronLeft className="h-4 w-4 text-amber-900" />
                                </button>
                                <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/60 tabular-nums">{selectedIndex! + 1} / {totalHives}</span>
                                <button onClick={onNext} disabled={!hasNext} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                                    <ChevronRight className="h-4 w-4 text-amber-900" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex justify-between">
                                <p className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">HRI Confidence</p>
                                <span className="text-sm font-black text-amber-950">{hive.readiness}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-yellow-100">
                                <div className="h-full rounded-full bg-yellow-400 transition-all duration-300" style={{ width: hive.readiness > 0 ? `${hive.readiness}%` : '0%', minWidth: 0 }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-yellow-50/50 p-4">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/60 uppercase">Beekeeper</p>
                                <p className="text-sm font-bold text-amber-950">{hive.beekeeper}</p>
                            </div>
                            <div className="rounded-2xl bg-yellow-50/50 p-4">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/60 uppercase">Species</p>
                                <p className="text-xs font-medium text-amber-800 italic">{hive.species}</p>
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-baseline gap-2">
                                <p className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">Sensor Profile</p>
                                <span className="text-[10px] text-amber-900/30">{formatLastReading(hive.last_reading)}</span>
                            </div>
                            {hive.status === 'no_data' ? (
                                <div className="rounded-xl bg-yellow-50/50 py-4 text-center text-sm text-amber-900/60">No sensor data received today</div>
                            ) : hasMqData ? (
                                <SensorRadarChart hiveName="" profile={{ avg_temperature: hive.temp, avg_humidity: hive.humidity, avg_mq2: hive.mq2, avg_mq3: hive.mq3, avg_mq5: hive.mq5, avg_mq135: hive.co2 }} height={240} />
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { icon: Thermometer, label: 'Temperature', value: hive.temp > 0 ? `${hive.temp}°C` : '—', warn: hive.temp > WARN_TEMP_ABOVE },
                                        { icon: Droplets, label: 'Humidity', value: hive.humidity > 0 ? `${hive.humidity}%` : '—', warn: hive.humidity > WARN_HUMID_ABOVE },
                                        { icon: Wind, label: 'MQ135 (VOC)', value: hive.co2 > 0 ? String(hive.co2) : '—', warn: hive.co2 > WARN_CO2_ABOVE },
                                    ].map((sensor) => (
                                        <div key={sensor.label} className="flex items-center justify-between rounded-xl bg-yellow-50/50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <sensor.icon className="h-4 w-4 text-amber-900/60" />
                                                <span className="text-sm text-amber-900">{sensor.label}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${sensor.warn ? 'text-red-600' : 'text-amber-950'}`}>{sensor.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate hives</p>
                    </div>
                );
            })()}
        </Modal>
    );
}
