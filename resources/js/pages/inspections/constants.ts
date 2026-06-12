export const BLOOMING_OPTIONS = [
    { value: 'pre_bloom', label: 'Pre-Bloom' },
    { value: 'early_bloom', label: 'Early Bloom' },
    { value: 'peak_bloom', label: 'Peak Bloom' },
    { value: 'post_bloom', label: 'Post-Bloom' },
    { value: 'dormant', label: 'Dormant' },
];

export const VEGETATION_OPTIONS = [
    { value: 'sparse', label: 'Sparse' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'dense', label: 'Dense' },
];

export const NECTAR_OPTIONS = [
    { value: 'scarce', label: 'Scarce' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'abundant', label: 'Abundant' },
];

export const DAMAGE_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
];

export const hiveFilterOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

export const hiveFormOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

export const toMultiIds = (items?: { id: number }[]) => items?.map((i) => i.id) ?? [];

export const masterToOptions = (items: { id: number; name: string }[]) =>
    items.map((i) => ({ value: i.id, label: i.name }));

export const emptyCreate = {
    hive_id: '',
    inspection_date: '',
    blooming_status: '',
    vegetation_density: '',
    nectar_source_availability: '',
    structural_damage: '',
    food_source_observation: '',
    notes: '',
};

export type InspectionCreateFormData = typeof emptyCreate & {
    weather_ids: number[];
    flora_ids: number[];
};

export type InspectionEditFormData = Omit<InspectionCreateFormData, 'hive_id'>;
