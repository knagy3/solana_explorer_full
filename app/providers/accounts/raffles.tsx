'use client';

import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { reportError } from '@utils/sentry';
import { RaffleAccountInfo } from '@validators/accounts/raffle';
import React from 'react';
import { create } from 'superstruct';
import { RestClient, FoxyRaffleEventsRequest } from "@hellomoon/api";
import { valueEventAriaMessage } from 'react-select/src/accessibility';

export const MOON_CLIENT_ID = "cc2bdbaf-640d-455e-8094-4adbe147fc3d";

export type RaffleInfoWithPubkey = {
    info: RaffleAccountInfo;
    pubkey: PublicKey;
};

interface AccountRaffles {
    raffles?: RaffleInfoWithPubkey[];
}

type State = Cache.State<AccountRaffles>;
type Dispatch = Cache.Dispatch<AccountRaffles>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function RafflesProvider({ children }: ProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<AccountRaffles>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

async function fetchAccountRaffles(dispatch: Dispatch, pubkey: PublicKey, cluster: Cluster, url: string) {
    const key = pubkey.toBase58();
    dispatch({
        key,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    const client = new RestClient(MOON_CLIENT_ID);
    let status;
    let data;
    try {
      const value  = await client.send(new FoxyRaffleEventsRequest({
        userAccount: pubkey.toBase58()
      }));

      // add_prize is filtered out  
      console.log("raffle account: ", value); 
      const filtered = value.data;
      // const filtered = value.data.filter(item => item.event !== 'ADD_PRIZE');
      data = {
          // remove slice
          raffles: filtered.map(accountInfo => {
              const info = create(accountInfo, RaffleAccountInfo);
              return { info, pubkey: pubkey };
          }),
      };
      status = FetchStatus.Fetched;
    } catch (error) {
        reportError(error, { url });
        status = FetchStatus.FetchFailed;
    }
    dispatch({ data, key, status, type: ActionType.Update, url });
}

export function useAccountOwnedRaffles(address: string): Cache.CacheEntry<AccountRaffles> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountRaffles must be used within a AccountsProvider`);
    }

    return context?.entries[address];
}

export function useFetchAccountRaffles() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchAccountRaffles must be used within a AccountsProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (pubkey: PublicKey) => {
            fetchAccountRaffles(dispatch, pubkey, cluster, url);
        },
        [dispatch, cluster, url]
    );
}
