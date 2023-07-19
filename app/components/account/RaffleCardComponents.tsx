import { RaffleInfoWithPubkey } from '@/app/providers/accounts/raffles';
// import { Confirmedevent, TransactionError } from '@solana/web3.js';
import React from 'react';
import { RefreshCw } from 'react-feather';

export type TransactionRow = {
    slot: number;
    signature: string;
    raffleAccount: string | null;
    pricePerTicket: number | null | undefined;
    prizeMint: string | null;
    err: null;
    blockTime: number | null | undefined;
    statusClass: string;
    statusText: string;
    numberoftickets: number | null | undefined;
    rafflePaymentAmount: number | null | undefined;
    event: string;
};

export type RaffleTransaction = {
  slot: number;
  signature: string;
  raffleAccount: string | null;
  pricePerTicket: number | null | undefined;
  prizeMint: string | null;
  err: null;
  blockTime: number | null | undefined;
  statusClass: string;
  statusText: string;
  numberoftickets: number | null | undefined;
  rafflePaymentAmount: number | null | undefined;
  event: string;
  winnerAccount: string | null;
  userAccount: string | null;
};

export function RaffleCardHeader({
    title,
    refresh,
    fetching,
}: {
    title: string;
    refresh: () => void;
    fetching: boolean;
}) {
    return (
        <div className="card-header align-items-center">
            <h3 className="card-header-title">{title}</h3>
            <button className="btn btn-white btn-sm" disabled={fetching} onClick={() => refresh()}>
                {fetching ? (
                    <>
                        <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                        Loading
                    </>
                ) : (
                    <>
                        <RefreshCw className="align-text-top me-2" size={13} />
                        Refresh
                    </>
                )}
            </button>
        </div>
    );
}

export function RaffleCardFooter({
    fetching,
    foundOldest,
    loadMore,
}: {
    fetching: boolean;
    foundOldest: boolean;
    loadMore: () => void;
}) {
    return (
        <div className="card-footer">
            {foundOldest ? (
                <div className="text-muted text-center">Fetched full Raffle</div>
            ) : (
                <button className="btn btn-primary w-100" onClick={() => loadMore()} disabled={fetching}>
                    {fetching ? (
                        <>
                            <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </button>
            )}
        </div>
    );
}

export function getRaffleTransactionRows(raffles: RaffleInfoWithPubkey[]): TransactionRow[] {
    const transactionRows: TransactionRow[] = [];

    for (let i = 0; i < raffles.length; i++) {
        const slot = raffles[i].info.blockId;
        const slotTransactions = [raffles[i]];
        while (i + 1 < raffles.length) {
            const nextSlot = raffles[i + 1].info.blockId;
            if (nextSlot !== slot) break;
            slotTransactions.push(raffles[++i]);
        }

        for (const slotTransaction of slotTransactions) 
        {
            let statusText;
            let statusClass;
            if (!slotTransaction.info.blockId) {
                statusClass = 'warning';
                statusText = 'Failed';
            } else {
                statusClass = 'success';
                statusText = 'Success';
            }
            transactionRows.push({
                raffleAccount: slotTransaction.info.raffleAccount,
                pricePerTicket: slotTransaction.info.pricePerTicket,
                prizeMint: slotTransaction.info.prizeMint,
                blockTime: slotTransaction.info.blockTime,
                err: null,
                signature: slotTransaction.info.transactionId,
                event: slotTransaction.info.event,
                numberoftickets: slotTransaction.info.numberoftickets,
                rafflePaymentAmount: slotTransaction.info.rafflePaymentAmount,
                slot,
                statusClass,
                statusText,
            });
        }
    }
    return transactionRows;
};

export function getRaffleTransactions(raffles: RaffleInfoWithPubkey[]): RaffleTransaction[] {
  const transactionRows: RaffleTransaction[] = [];

  for (let i = 0; i < raffles.length; i++) {
      const slot = raffles[i].info.blockId;
      const slotTransactions = [raffles[i]];
      while (i + 1 < raffles.length) {
          const nextSlot = raffles[i + 1].info.blockId;
          if (nextSlot !== slot) break;
          slotTransactions.push(raffles[++i]);
      }

      for (const slotTransaction of slotTransactions) 
      {
          let statusText;
          let statusClass;
          if (!slotTransaction.info.blockId) {
              statusClass = 'warning';
              statusText = 'Failed';
          } else {
              statusClass = 'success';
              statusText = 'Success';
          }
          transactionRows.push({
              raffleAccount: slotTransaction.info.raffleAccount,
              pricePerTicket: slotTransaction.info.pricePerTicket,
              prizeMint: slotTransaction.info.prizeMint,
              blockTime: slotTransaction.info.blockTime,
              err: null,
              signature: slotTransaction.info.transactionId,
              event: slotTransaction.info.event,
              numberoftickets: slotTransaction.info.numberoftickets,
              rafflePaymentAmount: slotTransaction.info.rafflePaymentAmount,
              slot,
              statusClass,
              statusText,
              winnerAccount:  slotTransaction.info.winnerAccount,
              userAccount: slotTransaction.info.userAccount
          });
      }
  }
  return transactionRows;
};