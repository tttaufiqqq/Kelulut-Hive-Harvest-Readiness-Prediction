import type {
    Inspection,
    MasterFloraType,
    MasterWeatherCondition,
    PaginatedInspections,
} from '@/types';

export type HiveOption = { id: number; name: string };

export type Props = {
    inspections: PaginatedInspections;
    hives: HiveOption[];
    weatherConditions: MasterWeatherCondition[];
    floraTypes: MasterFloraType[];
    filters: { hive_id?: string };
};

export type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; inspection: Inspection }
    | { type: 'delete'; inspection: Inspection }
    | null;

export type InspectionRecord = Inspection;

export type InspectionIdItem = { id: number };

export type InspectionCreateFormData = {
    hive_id: string;
    inspection_date: string;
    blooming_status: string;
    vegetation_density: string;
    nectar_source_availability: string;
    structural_damage: string;
    food_source_observation: string;
    notes: string;
    weather_ids: number[];
    flora_ids: number[];
};

export type InspectionEditFormData = Omit<
    InspectionCreateFormData,
    'hive_id'
>;
