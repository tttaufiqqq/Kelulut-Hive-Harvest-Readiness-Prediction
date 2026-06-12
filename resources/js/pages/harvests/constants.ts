import type { MasterHoneyColor, MasterHoneyFlavor } from '@/types';

export const PRODUCTIVITY_OPTIONS = [
    { value: '', label: '— None —' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

export const emptyCreate = {
    hive_id: '',
    harvest_date: '',
    weight: '',
    productivity_level: '',
    color_id: '',
    flavor_id: '',
    notes: '',
};

export const hiveOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

export const hiveFilterOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

export const colorOptions = (colors: MasterHoneyColor[]) => [
    { value: '', label: '— None —' },
    ...colors.map((c) => ({ value: String(c.id), label: c.name })),
];

export const flavorOptions = (flavors: MasterHoneyFlavor[]) => [
    { value: '', label: '— None —' },
    ...flavors.map((f) => ({ value: String(f.id), label: f.name })),
];
