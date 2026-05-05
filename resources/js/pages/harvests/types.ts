import type {
    Harvest,
    MasterHoneyColor,
    MasterHoneyFlavor,
    PaginatedHarvests,
} from '@/types';

export type HiveOption = { id: number; name: string };

export type Props = {
    harvests: PaginatedHarvests;
    hives: HiveOption[];
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
    filters: { hive_id?: string };
};

export type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; harvest: Harvest }
    | { type: 'delete'; harvest: Harvest }
    | null;

export type HarvestRecord = Harvest;
