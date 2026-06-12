import { SensorRadarChart } from '@/components/core/data/visualization-charts';
import type { SensorProfile } from '@/components/core/data/visualization-charts';
import type { HriGauge } from './HriGaugeGrid';

interface Props {
    hivesWithProfiles: HriGauge[];
    sensorProfiles: Record<number, SensorProfile>;
}

export function SensorProfilesGrid({ hivesWithProfiles, sensorProfiles }: Props) {
    if (hivesWithProfiles.length === 0) {
return null;
}

    return (
        <div>
            <h2 className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                Sensor Profiles
            </h2>
            <p className="mt-1 mb-4 text-sm text-amber-700">
                Environmental radar based on the latest sensor readings across temperature, humidity, and gas sensors.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {hivesWithProfiles.map((gauge) => (
                    <SensorRadarChart
                        key={gauge.hive_id}
                        hiveName={gauge.hive_name}
                        profile={sensorProfiles[gauge.hive_id]}
                    />
                ))}
            </div>
        </div>
    );
}
