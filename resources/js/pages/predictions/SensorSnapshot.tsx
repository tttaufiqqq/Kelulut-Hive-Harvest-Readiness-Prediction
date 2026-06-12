import { SnapshotGrid } from '@/components/core/readiness-chart-cards';
import type { PredictionEntry } from './types';
import { formatSensorReading, sensorLevelClass } from './utils';

interface SensorSnapshotProps {
    prediction: PredictionEntry;
}

export function SensorSnapshot({ prediction }: SensorSnapshotProps) {
    const thresholdMap = Object.fromEntries(
        prediction.threshold_match_summaries.map((s) => [s.sensor_type, s.level]),
    );

    return (
        <SnapshotGrid
            items={[
                {
                    label: 'Temp',
                    value: (
                        <span className={sensorLevelClass('temp', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.temp, '°C', 1)}
                        </span>
                    ),
                },
                {
                    label: 'Humidity',
                    value: (
                        <span className={sensorLevelClass('humidity', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.humidity, '%', 1)}
                        </span>
                    ),
                },
                {
                    label: 'MQ2',
                    value: (
                        <span className={sensorLevelClass('mq2_value', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.mq2_value)}
                        </span>
                    ),
                },
                {
                    label: 'MQ3',
                    value: (
                        <span className={sensorLevelClass('mq3_value', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.mq3_value)}
                        </span>
                    ),
                },
                {
                    label: 'MQ5',
                    value: (
                        <span className={sensorLevelClass('mq5_value', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.mq5_value)}
                        </span>
                    ),
                },
                {
                    label: 'MQ135',
                    value: (
                        <span className={sensorLevelClass('mq135_value', thresholdMap)}>
                            {formatSensorReading(prediction.sensor_values.mq135_value)}
                        </span>
                    ),
                },
            ]}
        />
    );
}
