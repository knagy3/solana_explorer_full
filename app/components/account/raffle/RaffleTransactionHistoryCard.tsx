'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { useFetchAccountRaffles, useAccountOwnedRaffles } from '@providers/accounts/raffles';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { useMemo } from 'react';
import Moment from 'react-moment';
import { RaffleCardFooter, RaffleCardHeader, getRaffleTransactionRows } from '../RaffleCardComponents';

export function RaffleTransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const ownedRaffles = useAccountOwnedRaffles(address);
    const fetchAccountRaffles = useFetchAccountRaffles();
    const refresh = () => fetchAccountRaffles(pubkey);
    // const loadMore = () => fetchAccountRaffles(pubkey, false);

    // const [showDropdown, setDropdown] = React.useState(false);
    // const display = useQueryDisplay();

    const transactionRows = React.useMemo(() => {
      if (ownedRaffles?.data?.raffles) 
      {
          return getRaffleTransactionRows(ownedRaffles.data.raffles);
      }
      return [];
    }, [ownedRaffles]);

    // Fetch owned raffles
    React.useEffect(() => {
        if (!ownedRaffles) refresh();
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    if (ownedRaffles === undefined) {
        return null;
    }

    const { status } = ownedRaffles;
    const raffles = ownedRaffles.data?.raffles;
    const fetching = status === FetchStatus.Fetching;

    if (fetching && (raffles === undefined || raffles.length === 0)) {
      return <LoadingCard message="Loading token holdings" />;
    } else if (raffles === undefined) {
        return <ErrorCard retry={refresh} text="Failed to fetch token holdings" />;
    }

    if (raffles.length === 0) {
      return <ErrorCard retry={refresh} retryText="Try Again" text={'No token holdings found'} />;
    }

    if (raffles.length > 100) {
        return <ErrorCard text="Token holdings is not available for accounts with over 100 token accounts" />;
    }


    if (ownedRaffles?.data === undefined) {
        if (ownedRaffles.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading history" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch transaction history" />;
    }

    const hasTimestamps = transactionRows.some(element => element.blockTime);
    const detailsList: React.ReactNode[] = transactionRows.map(
        ({ slot, signature, blockTime, statusClass, statusText, signatureInfo }) => {
            return (
                <tr key={signature}>
                    <td>
                        <Signature signature={signature} link truncateChars={60} />
                    </td>
                    <td className="w-1">
                        <Slot slot={slot} link />
                    </td>
                    {hasTimestamps && (
                        <>
                            <td className="text-muted">
                                {blockTime ? <Moment date={blockTime * 1000} fromNow /> : '---'}
                            </td>
                            <td className="text-muted">
                                {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                            </td>
                        </>
                    )}
                    <td className="text-muted">
                        {signatureInfo}
                    </td>
                    <td>
                        <span className={`badge bg-${statusClass}-soft`}>{statusText}</span>
                    </td>
                </tr>
            );
        }
    );

    return (
        <div className="card">
            <RaffleCardHeader fetching={fetching} refresh={() => refresh()} title="Raffle History" />
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">Raffle Signature</th>
                            <th className="text-muted w-1">Block</th>
                            {hasTimestamps && (
                                <>
                                    <th className="text-muted w-1">Age</th>
                                    <th className="text-muted w-1">Timestamp</th>
                                </>
                            )}
                            <th className="text-muted">Event</th>
                            <th className="text-muted">Result</th>
                        </tr>
                    </thead>
                    <tbody className="list">{detailsList}</tbody>
                </table>
            </div>
            <RaffleCardFooter fetching={fetching} foundOldest={false} loadMore={() => refresh()} />
        </div>
    );
}
