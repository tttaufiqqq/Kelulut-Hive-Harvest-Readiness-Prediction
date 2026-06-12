import type { ReactNode } from 'react';
import { Droplets, Flame, Thermometer } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/core/card';
import { AnimatedMetricValue } from './AnimatedMetricValue';
import { ArcGauge } from './ArcGauge';
import { ProgressBar } from './ProgressBar';
import { SensorHeader } from './SensorHeader';
import { SensorTrendChart } from './SensorTrendChart';
import { StatusBadge } from './SensorStatusBadge';
import type { HistoryPoint, NormalizedLatest } from './types';
import { MQ_GAUGE_MAX, humidColor, mqColor, tempColor } from './utils';

const SENSOR_DESCRIPTIONS = {
    temperature: 'Internal hive temperature',
    humidity: 'Relative humidity',
    mq2: 'Smoke / LPG',
    mq3: 'Alcohol / Benzene',
    mq5: 'LPG / Natural Gas',
    mq135: 'Air Quality / CO₂',
} as const;

type SensorKey = 'temperature' | 'humidity' | 'mq2' | 'mq3' | 'mq5' | 'mq135';

interface SensorCardConfig {
    key: SensorKey;
    label: string;
    description: string;
    value: number | null;
    suffix?: string;
    maxFractionDigits: number;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    renderVisual: () => ReactNode;
}

function arcVisual(sensorValue: number | null, max: number, colorFn: (v: number) => string) {
    return () => (
        <>
            <ArcGauge value={sensorValue ?? 0} max={max} color={sensorValue != null ? colorFn(sensorValue) : '#FEF3C7'} noData={sensorValue == null} />
            {sensorValue != null && <StatusBadge color={colorFn(sensorValue)} />}
        </>
    );
}

export interface SensorCardGridProps {
    normalizedLatest: NormalizedLatest;
    normalizedHistory: HistoryPoint[];
}

export function SensorCardGrid({ normalizedLatest, normalizedHistory }: SensorCardGridProps) {
    const sensorCards: SensorCardConfig[] = [
        {
            key: 'temperature', label: 'Temperature', description: SENSOR_DESCRIPTIONS.temperature,
            value: normalizedLatest?.temperature ?? null, suffix: '°C', maxFractionDigits: 1,
            icon: <Thermometer className="h-4 w-4" />, iconBg: 'bg-amber-100', iconColor: '#B45309',
            renderVisual: () => (
                <>
                    <ArcGauge value={normalizedLatest?.temperature ?? 0} max={45} color={normalizedLatest?.temperature != null ? tempColor(normalizedLatest.temperature) : '#FEF3C7'} noData={normalizedLatest?.temperature == null} />
                    {normalizedLatest?.temperature != null && <StatusBadge color={tempColor(normalizedLatest.temperature)} />}
                </>
            ),
        },
        {
            key: 'humidity', label: 'Humidity', description: SENSOR_DESCRIPTIONS.humidity,
            value: normalizedLatest?.humidity ?? null, suffix: '%', maxFractionDigits: 1,
            icon: <Droplets className="h-4 w-4" />, iconBg: 'bg-blue-50', iconColor: '#3B82F6',
            renderVisual: () => (
                <>
                    <ProgressBar value={normalizedLatest?.humidity ?? 0} color={normalizedLatest?.humidity != null ? humidColor(normalizedLatest.humidity) : '#FEF3C7'} noData={normalizedLatest?.humidity == null} />
                    {normalizedLatest?.humidity != null && <StatusBadge color={humidColor(normalizedLatest.humidity)} />}
                </>
            ),
        },
        { key: 'mq2', label: 'MQ-2', description: SENSOR_DESCRIPTIONS.mq2, value: normalizedLatest?.mq2 ?? null, maxFractionDigits: 0, icon: <Flame className="h-4 w-4" />, iconBg: 'bg-red-50', iconColor: '#EF4444', renderVisual: arcVisual(normalizedLatest?.mq2 ?? null, MQ_GAUGE_MAX, mqColor) },
        { key: 'mq3', label: 'MQ-3', description: SENSOR_DESCRIPTIONS.mq3, value: normalizedLatest?.mq3 ?? null, maxFractionDigits: 0, icon: <Flame className="h-4 w-4" />, iconBg: 'bg-red-50', iconColor: '#EF4444', renderVisual: arcVisual(normalizedLatest?.mq3 ?? null, MQ_GAUGE_MAX, mqColor) },
        { key: 'mq5', label: 'MQ-5', description: SENSOR_DESCRIPTIONS.mq5, value: normalizedLatest?.mq5 ?? null, maxFractionDigits: 0, icon: <Flame className="h-4 w-4" />, iconBg: 'bg-red-50', iconColor: '#EF4444', renderVisual: arcVisual(normalizedLatest?.mq5 ?? null, MQ_GAUGE_MAX, mqColor) },
        { key: 'mq135', label: 'MQ-135', description: SENSOR_DESCRIPTIONS.mq135, value: normalizedLatest?.mq135 ?? null, maxFractionDigits: 0, icon: <Flame className="h-4 w-4" />, iconBg: 'bg-red-50', iconColor: '#EF4444', renderVisual: arcVisual(normalizedLatest?.mq135 ?? null, MQ_GAUGE_MAX, mqColor) },
    ];
    const summarySensorCards = sensorCards.slice(0, 2);
    const gasSensorCards = sensorCards.slice(2);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {summarySensorCards.map(({ key, label, description, value, suffix, maxFractionDigits, icon, iconBg, iconColor, renderVisual }) => (
                    <Card key={key} className="flex min-h-[500px] min-w-0 flex-col p-4 sm:p-6">
                        <SensorHeader icon={icon} label={label} value={<AnimatedMetricValue value={value} suffix={suffix} maxFractionDigits={maxFractionDigits} />} iconBg={iconBg} iconColor={iconColor} />
                        <p className="text-xs text-amber-700/55">{description}</p>
                        <div className="mt-4 flex min-h-[174px] flex-col justify-center px-2 py-2">{renderVisual()}</div>
                        <div className="mt-auto"><SensorTrendChart data={normalizedHistory} dataKey={key} label={label} /></div>
                    </Card>
                ))}
            </div>
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }} className="rounded-xl bg-red-50 p-2 text-red-500">
                        <Flame className="h-4 w-4" />
                    </motion.div>
                    <span className="text-xs font-black tracking-widest text-amber-900/60 uppercase">Gas Sensors</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {gasSensorCards.map(({ key, label, description, value, suffix, maxFractionDigits, icon, iconBg, iconColor, renderVisual }) => (
                        <Card key={key} className="flex h-[500px] min-w-0 flex-col p-4 sm:p-6">
                            <SensorHeader icon={icon} label={label} value={<AnimatedMetricValue value={value} suffix={suffix} maxFractionDigits={maxFractionDigits} />} iconBg={iconBg} iconColor={iconColor} />
                            <p className="text-xs text-amber-700/55">{description}</p>
                            <div className="mt-4 flex min-h-[174px] flex-col justify-center px-2 py-2">{renderVisual()}</div>
                            <div className="mt-auto"><SensorTrendChart data={normalizedHistory} dataKey={key} label={label} /></div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
