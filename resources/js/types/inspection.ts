export type MasterWeatherCondition = { id: number; name: string };
export type MasterFloraType = { id: number; name: string };

export type Inspection = {
    id: number;
    hive_id: number;
    beekeeper_id: number;
    inspection_date: string;
    blooming_status: string | null;
    vegetation_density: string | null;
    nectar_source_availability: string | null;
    structural_damage: string | null;
    food_source_observation: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    hive?: { id: number; name: string };
    beekeeper?: { id: number; name: string };
    weather_conditions?: MasterWeatherCondition[];
    flora_types?: MasterFloraType[];
};

export type PaginatedInspections = {
    data: Inspection[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};
