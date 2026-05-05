import type { HiveOption, InspectionIdItem } from './types';

export const buildHiveFilterOptions = (hives: HiveOption[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((hive) => ({ value: String(hive.id), label: hive.name })),
];

export const buildHiveFormOptions = (hives: HiveOption[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((hive) => ({ value: String(hive.id), label: hive.name })),
];

export const toMultiIds = (items?: InspectionIdItem[]) =>
    items?.map((item) => item.id) ?? [];
