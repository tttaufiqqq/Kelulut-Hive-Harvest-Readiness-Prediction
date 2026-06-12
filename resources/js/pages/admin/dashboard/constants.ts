export type HiveData = {
    id: string;
    hive_name: string;
    beekeeper: string;
    species: string;
    weight: number;
    temp: number;
    humidity: number;
    co2: number;
    mq2: number;
    mq3: number;
    mq5: number;
    readiness: number;
    status: 'ready' | 'growing' | 'alert' | 'offline' | 'no_data';
    last_reading: string | null;
};

export type FleetTrendItem = {
    summary_date: string;
    avg_hri_pct: number;
    total_harvests: number;
};

export type ProductivityItem = {
    hive_name: string;
    beekeeper: string;
    total_weight: number;
    harvest_count: number;
};

export type CrossSiteItem = {
    site_name: string;
    avg_hri_pct: number;
    total_weight: number;
    hive_count: number;
};

export const STATUS_BADGE: Record<HiveData['status'], string> = {
    ready: 'bg-emerald-100 text-emerald-700',
    growing: 'bg-yellow-100 text-yellow-700',
    alert: 'bg-red-100 text-red-700',
    offline: 'bg-gray-100 text-gray-500',
    no_data: 'bg-slate-100 text-slate-400',
};

export const READINESS_LABEL: Record<HiveData['status'], string> = {
    ready: 'Ready to Harvest',
    growing: 'Approaching Readiness',
    alert: 'Needs Attention',
    offline: 'Sensor Offline',
    no_data: 'No Data Today',
};

export const STATUS_LABEL: Record<HiveData['status'], string> = {
    ready: 'Ready',
    growing: 'Growing',
    alert: 'Alert',
    offline: 'Offline',
    no_data: 'No Data',
};

export const STATUS_TO_LEVEL: Record<HiveData['status'], string> = {
    ready: 'ready',
    growing: 'approaching',
    alert: 'not_ready',
    offline: 'not_ready',
    no_data: 'no_data',
};

export const WARN_TEMP_ABOVE = 35;
export const WARN_HUMID_ABOVE = 85;
export const WARN_CO2_ABOVE = 800;

export const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

export const DAY_OPTIONS = [
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 180 days' },
];
