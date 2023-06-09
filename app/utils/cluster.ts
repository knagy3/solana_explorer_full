import { clusterApiUrl } from '@solana/web3.js';

export enum ClusterStatus {
    Connected,
    Connecting,
    Failure,
}

export enum Cluster {
    Metaplex,
    MainnetBeta,
    Testnet,
    Devnet,
    // Custom,
}

export const CLUSTERS = [Cluster.Metaplex, Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet];
// export const CLUSTERS = [Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet, Cluster.Custom];

export function clusterSlug(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.Metaplex:
            return 'metaplex';
        case Cluster.MainnetBeta:
            return 'mainnet-beta';
        case Cluster.Testnet:
            return 'testnet';
        case Cluster.Devnet:
            return 'devnet';
        // case Cluster.Custom:
        //     return 'custom';
    }
}

export function clusterName(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.Metaplex:
            return 'Metaplex';
        case Cluster.MainnetBeta:
            return 'Mainnet Beta';
        case Cluster.Testnet:
            return 'Testnet';
        case Cluster.Devnet:
            return 'Devnet';
        // case Cluster.Custom:
        //     return 'Custom';
    }
}

export const MAINNET_BETA_URL = clusterApiUrl('mainnet-beta');
export const METAPLEX_URL = 'https://shy-clean-glade.solana-mainnet.discover.quiknode.pro/886efa1b88a881c185a572d73a6ff1d6caa37208/';
export const TESTNET_URL = clusterApiUrl('testnet');
export const DEVNET_URL = clusterApiUrl('devnet');

export function clusterUrl(cluster: Cluster, customUrl: string): string {
    const modifyUrl = (url: string): string => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            return url;
        } else if( cluster === Cluster.Metaplex) {
           return url;
        } 
        else {
            return url.replace('api', 'explorer-api');
        }
    };

    switch (cluster) {
        case Cluster.Metaplex:
          return modifyUrl(METAPLEX_URL);
        case Cluster.Devnet:
            return process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
        case Cluster.MainnetBeta:
            return process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
        case Cluster.Testnet:
            return process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
        // case Cluster.Custom:
        //     return customUrl;
    }
}

export const DEFAULT_CLUSTER = Cluster.Metaplex;
