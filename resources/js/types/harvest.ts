export type MasterHoneyColor = { id: number; name: string };
export type MasterHoneyFlavor = { id: number; name: string };

export type Harvest = {
    id: number;
    hive_id: number;
    beekeeper_id: number;
    harvest_date: string;
    weight: number;
    productivity_level: 'Low' | 'Medium' | 'High' | null;
    color_id: number | null;
    flavor_id: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    hive?: { id: number; name: string };
    beekeeper?: { id: number; name: string };
    color?: MasterHoneyColor;
    flavor?: MasterHoneyFlavor;
};

export type PaginatedHarvests = {
    data: Harvest[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};
