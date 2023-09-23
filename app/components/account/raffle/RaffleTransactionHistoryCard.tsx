'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
// import { Slot } from '@components/common/Slot';
import { useFetchAccountRaffles, useAccountOwnedRaffles } from '@providers/accounts/raffles';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { useCallback, useMemo } from 'react';
// import Moment from 'react-moment';
import { RaffleCardFooter, RaffleCardHeader, getRaffleTransactionRows } from '../RaffleCardComponents';
import { SolBalance } from '../../common/SolBalance';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'react-feather';
import Link from 'next/link';
import { RaffleAccount } from '../../../validators/accounts/raffle';
import { RaffleTransactionsCard } from './RaffleTransactionsCard';

const ALL_FILTERS = '';

const useQueryFilter = (): string => {
  const searchParams = useSearchParams();
  const filter = searchParams?.get('filter');
  return filter || '';
};

type FilterProps = {
  filter: string;
  toggle: () => void;
  show: boolean;
  events: string[];
};

const FilterDropdown = ({ filter, toggle, show, events }: FilterProps) => {
  // const { cluster } = useCluster();
  // const { tokenRegistry } = useTokenRegistry();
  const currentSearchParams = useSearchParams();
  const currentPathname = usePathname();
  const buildLocation = useCallback(
      (filter: string) => {
          const params = new URLSearchParams(currentSearchParams?.toString());
          if (filter === ALL_FILTERS) {
              params.delete('filter');
          } else {
              params.set('filter', filter);
          }
          const nextQueryString = params.toString();
          return `${currentPathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
      },
      [currentPathname, currentSearchParams]
  );

  const filterOptions: string[] = [ALL_FILTERS];
  const nameLookup: Map<string, string> = new Map();

  events.forEach(event => {
      const address = event.toLowerCase();
      if (!nameLookup.has(address)) {
          filterOptions.push(address);
          nameLookup.set(address, event);
      }
  });

  return (
      <div className="dropdown me-2">
          <small className="me-2">Filter: </small>
          <button className="btn btn-white btn-sm " type="button" onClick={toggle}>
              {filter === ALL_FILTERS ? 'All Filters' : nameLookup.get(filter)}{' '}
              <ChevronDown size={15} className="align-text-top" />
          </button>
          <div className={`token-filter dropdown-menu-end dropdown-menu${show ? ' show' : ''}`}>
              {filterOptions.map(filterOption => {
                  return (
                      <Link
                          key={filterOption}
                          href={buildLocation(filterOption)}
                          className={`dropdown-item${filterOption === filter ? ' active' : ''}`}
                          onClick={toggle}
                      >
                          {filterOption === ALL_FILTERS
                              ? 'All Events'
                              : filterOption
                          }
                      </Link>
                  );
              })}
          </div>
      </div>
  );
};

export function RaffleTransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const ownedRaffles = useAccountOwnedRaffles(address);
    const fetchAccountRaffles = useFetchAccountRaffles();
    const refresh = () => fetchAccountRaffles(pubkey);
    // const loadMore = () => fetchAccountRaffles(pubkey, false);

    // const [showDropdown, setDropdown] = React.useState(false);
    // const display = useQueryDisplay();

    const [showDropdown, setDropdown] = React.useState(false);
    const filter = useQueryFilter();
    const events = ['BUY_TICKETS', 'CREATE_RAFFLE', 'CANCEL_RAFFLE', 'COLLECT_PROCEEDS', 'CLAIM_PRIZE', 'ADD_PRIZE'];

    const transactionRows = React.useMemo(() => {
      if (ownedRaffles?.data?.raffles) 
      {
          return getRaffleTransactionRows(ownedRaffles.data.raffles);
      }
      return [];
    }, [ownedRaffles]);

    const filteredTransactionRows = React.useMemo(
      () =>
       transactionRows.filter(transactionRow => {
              if (filter === ALL_FILTERS) 
              {
                  return true;
              }
              return transactionRow.event.toLowerCase() === filter;
          }),
      [filter, transactionRows]
    );


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

    const hasTimestamps = filteredTransactionRows.some(element => element.blockTime);
    const detailsList: React.ReactNode[] = filteredTransactionRows.map(
        ({ signature, blockTime, statusClass, statusText, event, numberoftickets, rafflePaymentAmount, raffleAccount, pricePerTicket, prizeMint }, index) => {
            
            const finalPricePerTicket = pricePerTicket
              ? pricePerTicket
              : rafflePaymentAmount && numberoftickets
                ? rafflePaymentAmount / numberoftickets
                : null

            return (
                <tr key={index}>
                    <td>
                        <Signature signature={signature} link truncateChars={20} />
                    </td>
                    <td>
                        {raffleAccount  
                          ? (<Signature signature={raffleAccount} link truncateChars={20} /> )
                          : ( "-" )
                        }
                    </td>
                    {hasTimestamps && (
                        <>
                            {/* <td className="text-muted">
                                {blockTime ? <Moment date={blockTime * 1000} fromNow /> : '---'}
                            </td> */}
                            <td className="text-muted">
                                {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                            </td>
                        </>
                    )}
                    <td className="text-muted">
                        {event}
                    </td>
                    <td className="text-lg-center text-uppercase">
                        {finalPricePerTicket
                          ? (<SolBalance lamports={finalPricePerTicket} /> )
                          : ( "-" )
                        }
                    </td>
                    <td className="text-lg-center">
                        {numberoftickets ? numberoftickets : "-"}
                    </td>
                    <td className="text-lg-center text-uppercase">
                        {rafflePaymentAmount  
                          ? (<SolBalance lamports={rafflePaymentAmount} /> )
                          : ( "-" )
                        }
                    </td>
                    <td>
                        {prizeMint  
                          ? (<Signature signature={prizeMint} link truncateChars={20} /> )
                          : ( "-" )
                        }
                    </td>
                    {/* <td> */}
                        {raffleAccount  
                          ? ( <RaffleTransactionsCard address={raffleAccount} price={finalPricePerTicket}/> )
                          : ( "-" )
                        }
                    {/* </td> */}
                    <td>
                        <span className={`badge bg-${statusClass}-soft`}>{statusText}</span>
                    </td>
                </tr>
            );
        }
    );

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Raffle History</h3>
                <FilterDropdown
                    filter={filter}
                    toggle={() => setDropdown(show => !show)}
                    show={showDropdown}
                    events={events}
                ></FilterDropdown>
                <RaffleCardHeader fetching={fetching} refresh={() => refresh()} title="" />
            </div>

            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">Transaction Signature</th>
                            <th className="text-muted w-1">Raffle Signature</th>
                            {/* <th className="text-muted w-1">Block</th> */}
                            {hasTimestamps && (
                                <>
                                    {/* <th className="text-muted w-1">Age</th> */}
                                    <th className="text-muted w-1">Timestamp</th>
                                </>
                            )}
                            <th className="text-muted">Event</th>
                            <th className="text-muted">Price Per Tickets</th>
                            <th className="text-muted">Bought Tickets</th>
                            <th className="text-muted">Payment Amount</th>
                            <th className="text-muted">NFT</th>
                            <th className="text-muted">Sold Tickets</th>
                            <th className="text-muted">Winner</th>
                            <th className="text-muted">Purchase Price</th>
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
