import type {
    HiveOption,
    Props,
} from './types';

export const buildHiveFormOptions = (hives: HiveOption[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((hive) => ({ value: String(hive.id), label: hive.name })),
];

export const buildHiveFilterOptions = (hives: HiveOption[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((hive) => ({ value: String(hive.id), label: hive.name })),
];

export const buildColorOptions = (colors: Props['colors']) => [
    { value: '', label: '— None —' },
    ...colors.map((color) => ({
        value: String(color.id),
        label: color.name,
    })),
];

export const buildFlavorOptions = (flavors: Props['flavors']) => [
    { value: '', label: '— None —' },
    ...flavors.map((flavor) => ({
        value: String(flavor.id),
        label: flavor.name,
    })),
];
