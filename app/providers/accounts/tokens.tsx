'use client';

import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { reportError } from '@utils/sentry';
import { TokenAccountInfo } from '@validators/accounts/token';
import React from 'react';
import { create } from 'superstruct';
import { Token } from '@solana/spl-token';

export type TokenHistory = {
    blockTime: number;
    buyer: string;
    buyerReferral : string;
    collection : string;
    collectionSymbol: string;
    price : number;
    seller : string;
    sellerReferral : string;
    signature : string;
    slot : number;
    source : string;
    tokenMint : string;
    type : string;
};

interface AccountTokens {
    tokens?: TokenHistory[];
}

type State = Cache.State<AccountTokens>;
type Dispatch = Cache.Dispatch<AccountTokens>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TokensProvider({ children }: ProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<AccountTokens>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function fetchAccountTokens(dispatch: Dispatch, pubkey: PublicKey, cluster: Cluster, url: string) {
    const key = pubkey.toBase58();
    dispatch({
        key,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status;
    let data;
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    try {

        const response = await fetch('https://api-mainnet.magiceden.dev/v2/wallets/GRBgXmhy8mViabhu7PW83YsLciYwDH9A8tD4FKe4T3SE/activities?limit=200', options);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data2 = await response.json();

        // const { value } = await new Connection(url).getParsedTokenAccountsByOwner(pubkey, {
        //     programId: TOKEN_PROGRAM_ID,
        // });
        data = {
            // remove slice

            tokens: data2

            // tokens: value.slice(0, 101).map(accountInfo => {
            //     const parsedInfo = accountInfo.account.data.parsed.info;
            //     const info = create(parsedInfo, TokenAccountInfo);
            //     return { info, pubkey: accountInfo.pubkey };
            // }),
        };
        status = FetchStatus.Fetched;
    } catch (error) {
        reportError(error, { url });
        status = FetchStatus.FetchFailed;
    }
    dispatch({ data, key, status, type: ActionType.Update, url });
}

export function useAccountOwnedTokens(address: string): Cache.CacheEntry<AccountTokens> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountOwnedTokens must be used within a AccountsProvider`);
    }

    return context.entries[address];
}

export function useFetchAccountOwnedTokens() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchAccountOwnedTokens must be used within a AccountsProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (pubkey: PublicKey) => {
            fetchAccountTokens(dispatch, pubkey, cluster, url);
        },
        [dispatch, cluster, url]
    );
}
