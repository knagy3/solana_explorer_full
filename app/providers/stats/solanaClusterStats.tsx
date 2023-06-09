'use client';

import { useCluster } from '@providers/cluster';
import { Connection } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { reportError } from '@utils/sentry';
import React from 'react';
import useTabVisibility from 'use-tab-visibility';

import { DashboardInfo, DashboardInfoActionType, dashboardInfoReducer } from './solanaDashboardInfo';
import { PerformanceInfo, PerformanceInfoActionType, performanceInfoReducer } from './solanaPerformanceInfo';

export const PERF_UPDATE_SEC = 5;
export const SAMPLE_HISTORY_HOURS = 6;
export const PERFORMANCE_SAMPLE_INTERVAL = 600000;
export const TRANSACTION_COUNT_INTERVAL = 50000;
export const EPOCH_INFO_INTERVAL = 20000;
export const BLOCK_TIME_INTERVAL = 50000;
export const LOADING_TIMEOUT = 100000;

export enum ClusterStatsStatus {
    Loading,
    Ready,
    Error,
}

const initialPerformanceInfo: PerformanceInfo = {
    avgTps: 0,
    historyMaxTps: 0,
    perfHistory: {
        long: [],
        medium: [],
        short: [],
    },
    status: ClusterStatsStatus.Loading,
    transactionCount: 0,
};

const initialDashboardInfo: DashboardInfo = {
    avgSlotTime_1h: 0,
    avgSlotTime_1min: 0,
    epochInfo: {
        absoluteSlot: 0,
        blockHeight: 0,
        epoch: 0,
        slotIndex: 0,
        slotsInEpoch: 0,
    },
    status: ClusterStatsStatus.Loading,
};

type SetActive = React.Dispatch<React.SetStateAction<boolean>>;
const StatsProviderContext = React.createContext<
    | {
          setActive: SetActive;
          setTimedOut: () => void;
          retry: () => void;
          active: boolean;
      }
    | undefined
>(undefined);

type DashboardState = { info: DashboardInfo };
const DashboardContext = React.createContext<DashboardState | undefined>(undefined);

type PerformanceState = { info: PerformanceInfo };
const PerformanceContext = React.createContext<PerformanceState | undefined>(undefined);

type Props = { children: React.ReactNode };

function getConnection(url: string): Connection | undefined {
    try {
        return new Connection(url, 'confirmed', {requestTimeout: 5000});
    } catch (error) {
        console.log('Connection Error: ', error)
    }
}

export function SolanaClusterStatsProvider({ children }: Props) {
    const { cluster, url } = useCluster();
    const [active, setActive] = React.useState(false);
    const [dashboardInfo, dispatchDashboardInfo] = React.useReducer(dashboardInfoReducer, initialDashboardInfo);
    const [performanceInfo, dispatchPerformanceInfo] = React.useReducer(performanceInfoReducer, initialPerformanceInfo);
    const { visible: isTabVisible } = useTabVisibility();
    React.useEffect(() => {
        if (!active || !isTabVisible || !url) return;

        const connection = getConnection(url);

        if (!connection) return;

        let lastSlot: number | null = null;
        let stale = false;
        const getPerformanceSamples = async () => {
            try {
                const samples = await connection.getRecentPerformanceSamples(60 * SAMPLE_HISTORY_HOURS);
                if (stale) {
                    return;
                }
                if (samples.length < 1) {
                    // no samples to work with (node has no history).
                    return; // we will allow for a timeout instead of throwing an error
                }

                dispatchPerformanceInfo({
                    data: samples,
                    type: PerformanceInfoActionType.SetPerfSamples,
                });

                dispatchDashboardInfo({
                    data: samples,
                    type: DashboardInfoActionType.SetPerfSamples,
                });
            } catch (error) {
                reportError(error, { url });
                if (error instanceof Error) {
                    dispatchPerformanceInfo({
                        data: error.toString(),
                        type: PerformanceInfoActionType.SetError,
                    });
                    dispatchDashboardInfo({
                        data: error.toString(),
                        type: DashboardInfoActionType.SetError,
                    });
                }
                setActive(false);
            }
        };

        const getTransactionCount = async () => {
            try {
                const transactionCount = await connection.getTransactionCount();
                if (stale) {
                    return;
                }
                dispatchPerformanceInfo({
                    data: transactionCount,
                    type: PerformanceInfoActionType.SetTransactionCount,
                });
            } catch (error) {
                reportError(error, { url });
                if (error instanceof Error) {
                    dispatchPerformanceInfo({
                        data: error.toString(),
                        type: PerformanceInfoActionType.SetError,
                    });
                }
                setActive(false);
            }
        };

        const getEpochInfo = async () => {
            try {
                const epochInfo = await connection.getEpochInfo();
                if (stale) {
                    return;
                }
                lastSlot = epochInfo.absoluteSlot;
                dispatchDashboardInfo({
                    data: epochInfo,
                    type: DashboardInfoActionType.SetEpochInfo,
                });
            } catch (error) {
                reportError(error, { url });
                if (error instanceof Error) {
                    dispatchDashboardInfo({
                        data: error.toString(),
                        type: DashboardInfoActionType.SetError,
                    });
                }
                setActive(false);
            }
        };

        const getBlockTime = async () => {
            if (lastSlot) {
                try {
                    const blockTime = await connection.getBlockTime(lastSlot);
                    if (stale) {
                        return;
                    }
                    if (blockTime !== null) {
                        dispatchDashboardInfo({
                            data: {
                                blockTime: blockTime * 1000,
                                slot: lastSlot,
                            },
                            type: DashboardInfoActionType.SetLastBlockTime,
                        });
                    }
                } catch (error) {
                    // let this fail gracefully
                }
            }
        };

        const performanceInterval = setInterval(getPerformanceSamples, PERFORMANCE_SAMPLE_INTERVAL);
        const transactionCountInterval = setInterval(getTransactionCount, TRANSACTION_COUNT_INTERVAL);
        const epochInfoInterval = setInterval(getEpochInfo, EPOCH_INFO_INTERVAL);
        const blockTimeInterval = setInterval(getBlockTime, BLOCK_TIME_INTERVAL);

        getPerformanceSamples();
        getTransactionCount();
        (async () => {
            await getEpochInfo();
            await getBlockTime();
        })();

        return () => {
            clearInterval(performanceInterval);
            clearInterval(transactionCountInterval);
            clearInterval(epochInfoInterval);
            clearInterval(blockTimeInterval);
            stale = true;
        };
    }, [active, cluster, isTabVisible, url]);

    // Reset when cluster changes
    React.useEffect(() => {
        return () => {
            resetData();
        };
    }, [url]);

    function resetData() {
        dispatchDashboardInfo({
            data: initialDashboardInfo,
            type: DashboardInfoActionType.Reset,
        });
        dispatchPerformanceInfo({
            data: initialPerformanceInfo,
            type: PerformanceInfoActionType.Reset,
        });
    }

    const setTimedOut = React.useCallback(() => {
        dispatchDashboardInfo({
            data: 'Cluster stats timed out',
            type: DashboardInfoActionType.SetError,
        });
        dispatchPerformanceInfo({
            data: 'Cluster stats timed out',
            type: PerformanceInfoActionType.SetError,
        });
        console.error('Cluster stats timed out');
        setActive(false);
    }, []);

    const retry = React.useCallback(() => {
        resetData();
        setActive(true);
    }, []);

    return (
        <StatsProviderContext.Provider value={{ active, retry, setActive, setTimedOut }}>
            <DashboardContext.Provider value={{ info: dashboardInfo }}>
                <PerformanceContext.Provider value={{ info: performanceInfo }}>{children}</PerformanceContext.Provider>
            </DashboardContext.Provider>
        </StatsProviderContext.Provider>
    );
}

export function useStatsProvider() {
    const context = React.useContext(StatsProviderContext);
    if (!context) {
        throw new Error(`useContext must be used within a StatsProvider`);
    }
    return context;
}

export function useDashboardInfo() {
    const context = React.useContext(DashboardContext);
    if (!context) {
        throw new Error(`useDashboardInfo must be used within a StatsProvider`);
    }
    return context.info;
}

export function usePerformanceInfo() {
    const context = React.useContext(PerformanceContext);
    if (!context) {
        throw new Error(`usePerformanceInfo must be used within a StatsProvider`);
    }
    return context.info;
}
