'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { useAccountHistory, useFetchAccountHistory } from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { PublicKey, ParsedTransactionWithMeta, TransactionSignature } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { Suspense, useMemo, useState } from 'react';
import Moment from 'react-moment';

import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';
import { useTransactionDetails } from '@/app/providers/transactions';
import BigNumber from 'bignumber.js';
import { BalanceDelta } from '../../common/BalanceDelta';
import { Address } from '../../common/Address';
import { SignatureProps } from '@/app/utils';
import { SolBalance } from '../../common/SolBalance';
import { SignatureContext } from '../../instruction/SignatureContext';
import { useFetchTransactionDetails } from '@/app/providers/transactions/parsed';

type MyComponentProps = {
  signature: TransactionSignature;
};

function AccountsCard({ signature } : MyComponentProps) {
  
  const details = useTransactionDetails(signature);
  const fetchDetails = useFetchTransactionDetails();
  const transactionWithMeta = details?.data?.transactionWithMeta;

    // Fetch details on load
    React.useEffect(() => {
      if (!details ) {
          fetchDetails(signature);
      }
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps



  if (!transactionWithMeta) {
      return null;
  }

  const { meta, transaction } = transactionWithMeta;
  const { message } = transaction;

  if (!meta) {
      return <ErrorCard text="Transaction metadata is missing" />;
  }

  const pre = meta?.preBalances[0];
  const post = meta?.postBalances[0];
  const key = message?.accountKeys[0].pubkey.toBase58();
  const delta = new BigNumber(post).minus(new BigNumber(pre));

  return (
    <>
      <td>
        <Signature signature={key} link truncateChars={30} />
      </td>
      <td>
          <BalanceDelta delta={delta} isSol />
      </td>
    </>
  );
}


export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(pubkey, false, true);
    const loadMore = () => fetchAccountHistory(pubkey, false);

    const transactionRows = React.useMemo(() => {
        if (history?.data?.fetched) 
        {
          return getTransactionRows(history.data.fetched);
        }
        return [];
    }, [history]);

    React.useEffect(() => {
        if (!history) {
            refresh();
        }
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps
    
    if (!history) {
        return null;
    }

    if (history?.data === undefined) {
        if (history.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading history" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch transaction history" />;
    }

    const hasTimestamps = transactionRows.some(element => element?.blockTime);

    const detailsList: React.ReactNode[] = transactionRows.map(
        ({ slot, signature, blockTime, statusClass, statusText }) => {
            
          return (
            <tr key={signature}>
                <td>
                    <Signature signature={signature} link truncateChars={30} />
                </td>
                <SignatureContext.Provider value={signature}>
                    <AccountsCard signature={signature}/>
                </SignatureContext.Provider>

                {hasTimestamps && (
                    <>
                        {/* <tr className="text-muted">
                            {blockTime ? <Moment date={blockTime * 1000} fromNow /> : '---'}
                        </td> */}
                        <td className="text-muted">
                            {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                        </td>
                    </>
                )}

                <td>
                    <span className={`badge bg-${statusClass}-soft`}>{statusText}</span>
                </td>
            </tr>
          );
        }
    );

    const fetching = history.status === FetchStatus.Fetching;

    return (
        <div className="card">
            <HistoryCardHeader fetching={fetching} refresh={() => refresh()} title="Transaction History" />
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">Transaction Signature</th>
                            <th className="text-muted w-1">Buyer</th>
                            <th className="text-muted w-1">Change (SOL)</th>
                            {hasTimestamps && (
                                <>
                                    {/* <th className="text-muted w-1">Age</th> */}
                                    <th className="text-muted w-1">Timestamp</th>
                                </>
                            )}
                            <th className="text-muted">Result</th>
                        </tr>
                    </thead>
                    <tbody className="list">{detailsList}</tbody>
                </table>
            </div>
            <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
        </div>
    );
}
