export interface HiveData {
    id: string;
    name: string;
    species: string;
    ageMonths: number;
    weightKg: number;
    activityLevel: number; // bees per minute
    lastHarvestDate?: string;
    location: string;
}

export interface PredictionResult {
    readinessScore: number; // 0-100
    estimatedHarvestDate: string;
    recommendations: string;
    confidence: number;
}
