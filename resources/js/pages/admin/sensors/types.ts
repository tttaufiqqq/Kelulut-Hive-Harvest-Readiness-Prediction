export type Hive = { id: number; name: string };

export type LatestReading = {
    temperature: number | null;
    humidity: number | null;
    mq2: number | null;
    mq3: number | null;
    mq5: number | null;
    mq135: number | null;
    recorded_at: string;
} | null;

export type HistoryPoint = {
    time: string;
    temperature: number | null;
    humidity: number | null;
    mq2: number | null;
    mq3: number | null;
    mq5: number | null;
    mq135: number | null;
};

export type NormalizedLatest = {
    temperature: number | null;
    humidity: number | null;
    mq2: number | null;
    mq3: number | null;
    mq5: number | null;
    mq135: number | null;
    recorded_at: string;
} | null;
