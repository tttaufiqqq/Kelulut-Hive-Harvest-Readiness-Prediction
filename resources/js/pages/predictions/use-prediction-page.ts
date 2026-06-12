import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';
import type { PaginatedPredictions, PredictionEntry } from './types';

interface UsePredictionPageParams {
    hive: { id: number };
    latestPrediction: PredictionEntry | null;
    historyPredictions: PaginatedPredictions;
    filters: { page: number };
}

export function usePredictionPage({ hive, latestPrediction, historyPredictions, filters }: UsePredictionPageParams) {
    const liveReloadInFlight = useRef(false);
    const prevTimestampRef = useRef<string | null | undefined>(undefined);
    const predictionChannelName = `hive.${hive.id}.predictions`;
    const [showHistory, setShowHistory] = useState(filters.page > 1);
    const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
    const [secondsAgo, setSecondsAgo] = useState(0);
    const [justUpdated, setJustUpdated] = useState(false);

    const activeHistoryIndex = activeHistoryId === null
        ? null
        : historyPredictions.data.findIndex((p) => p.id === activeHistoryId);
    const activeHistoryPrediction = activeHistoryIndex !== null && activeHistoryIndex >= 0
        ? (historyPredictions.data[activeHistoryIndex] ?? null)
        : null;
    const hasPrevHistory = activeHistoryIndex !== null && activeHistoryIndex > 0;
    const hasNextHistory = activeHistoryIndex !== null && activeHistoryIndex < historyPredictions.data.length - 1;

    useEffect(() => {
        const resetLiveReload = () => { liveReloadInFlight.current = false; };
        const removeStartListener = router.on('start', () => { liveReloadInFlight.current = true; });
        const removeFinishListener = router.on('finish', resetLiveReload);
        return () => { removeStartListener(); removeFinishListener(); };
    }, []);

    useEffect(() => {
        const realtime = echo();
        const channel = realtime.private(predictionChannelName);
        const eventName = '.prediction.created';
        const resetLiveReload = () => { liveReloadInFlight.current = false; };
        const reloadPredictionProps = () => {
            if (document.hidden || liveReloadInFlight.current) return;
            liveReloadInFlight.current = true;
            router.reload({
                only: ['latestPrediction', 'sensorWarnings', 'predictionTrends', 'historyPredictions'],
                onCancel: resetLiveReload,
                onError: resetLiveReload,
                onFinish: resetLiveReload,
                onSuccess: resetLiveReload,
            });
        };
        channel.listen(eventName, reloadPredictionProps);
        return () => { channel.stopListening(eventName, reloadPredictionProps); realtime.leave(predictionChannelName); };
    }, [predictionChannelName]);

    useEffect(() => {
        if (activeHistoryIndex === null || activeHistoryIndex < 0) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveHistoryId(historyPredictions.data[activeHistoryIndex - 1]?.id ?? activeHistoryId);
            }
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveHistoryId(historyPredictions.data[activeHistoryIndex + 1]?.id ?? activeHistoryId);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeHistoryId, activeHistoryIndex, historyPredictions.data]);

    useEffect(() => {
        if (prevTimestampRef.current === undefined) {
            prevTimestampRef.current = latestPrediction?.prediction_timestamp;
            return;
        }
        if (latestPrediction?.prediction_timestamp !== prevTimestampRef.current) {
            prevTimestampRef.current = latestPrediction?.prediction_timestamp;
            setJustUpdated(true); // eslint-disable-line react-hooks/set-state-in-effect
            const timer = setTimeout(() => setJustUpdated(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [latestPrediction?.prediction_timestamp]);

    useEffect(() => {
        if (!latestPrediction?.prediction_timestamp) return;
        const computeSecondsAgo = () => {
            const diff = Math.floor((Date.now() - new Date(latestPrediction.prediction_timestamp!).getTime()) / 1000);
            setSecondsAgo(Math.max(0, diff)); // eslint-disable-line react-hooks/set-state-in-effect
        };
        computeSecondsAgo();
        const interval = setInterval(computeSecondsAgo, 1000);
        return () => clearInterval(interval);
    }, [latestPrediction?.prediction_timestamp]);

    return {
        showHistory, setShowHistory,
        activeHistoryId, setActiveHistoryId,
        secondsAgo, justUpdated,
        activeHistoryIndex, activeHistoryPrediction,
        hasPrevHistory, hasNextHistory,
    };
}
