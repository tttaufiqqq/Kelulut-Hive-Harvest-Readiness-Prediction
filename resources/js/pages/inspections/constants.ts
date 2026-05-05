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

export const EMPTY_CREATE_INSPECTION_FORM = {
    hive_id: '',
    inspection_date: '',
    blooming_status: '',
    vegetation_density: '',
    nectar_source_availability: '',
    structural_damage: '',
    food_source_observation: '',
    notes: '',
};
