'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
// import { Slot } from '@components/common/Slot';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { useCallback, useMemo } from 'react';
// import Moment from 'react-moment';
import { getRaffleTransactions } from '../RaffleCardComponents';
import { SolBalance } from '../../common/SolBalance';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'react-feather';
import Link from 'next/link';
import { useFetchRaffleTransactions, useRaffleTransactions } from '@/app/providers/accounts/raffle-transactions';


export function RaffleTransactionsCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const raffleTransactions = useRaffleTransactions(address);
    const fetchRaffleTransactions = useFetchRaffleTransactions();
    const refresh = () => fetchRaffleTransactions(pubkey);

    // const [showDropdown, setDropdown] = React.useState(false);
    // const display = useQueryDisplay();

    const transactions = React.useMemo(() => {
      if (raffleTransactions?.data?.raffleAccount) 
      {
          return getRaffleTransactions(raffleTransactions.data.raffleAccount);
      }
      return [];
    }, [raffleTransactions]);

    console.log("owned raffles: ", transactions)

    // const filteredTransactionRows = React.useMemo(
    //   () =>
    //    transactionRows.filter(transactionRow => {
    //           if (filter === ALL_FILTERS) 
    //           {
    //               return true;
    //           }
    //           return transactionRow.event.toLowerCase() === filter;
    //       }),
    //   [filter, transactionRows]
    // );


    // Fetch owned raffles
    React.useEffect(() => {
        if (!raffleTransactions) refresh();
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    if (raffleTransactions === undefined) {
        return null;
    }

    const { status } = raffleTransactions;
    const raffles = raffleTransactions.data?.raffleAccount;
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

    if (raffleTransactions?.data === undefined) {
        if (raffleTransactions.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading history" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch transaction history" />;
    }

    // const hasTimestamps = transactionRows.some(element => element.blockTime);

    // console.log("raffle transactions: ", detailsList)

    return (
      <>
        <td>
            {transactions[0].winnerAccount  
              ? (<Signature signature={transactions[0].winnerAccount} link truncateChars={30} /> )
              : ( "-" )
            }
        </td>
        {/* <td>
            <BalanceDelta delta={delta} isSol />
        </td> */}
      </>
    );
}
