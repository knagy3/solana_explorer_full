'use client';

import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { isMangoInstruction, parseMangoInstructionTitle } from '@components/instruction/mango/types';
import { isSerumInstruction, parseSerumInstructionTitle } from '@components/instruction/serum/types';
import {
    isTokenLendingInstruction,
    parseTokenLendingInstructionTitle,
} from '@components/instruction/token-lending/types';
import { isTokenSwapInstruction, parseTokenSwapInstructionTitle } from '@components/instruction/token-swap/types';
import { useAccountHistories, useFetchAccountHistory } from '@providers/accounts/history';
import { TOKEN_PROGRAM_ID, TokenHistory, useAccountOwnedTokens, useFetchAccountOwnedTokens } from '@providers/accounts/tokens';
import { CacheEntry, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { useTokenRegistry } from '@providers/mints/token-registry';
import { Details, useFetchTransactionDetails, useTransactionDetailsCache } from '@providers/transactions/parsed';
import { TokenInfoMap } from '@solana/spl-token-registry';
import { ConfirmedSignatureInfo, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import { getTokenProgramInstructionName } from '@utils/instruction';
import { reportError } from '@utils/sentry';
import { displayAddress, intoTransactionInstruction } from '@utils/tx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { ChevronDown, MinusSquare, PlusSquare, RefreshCw } from 'react-feather';
import { Timestamp } from '../../providers/transactions/index';
import { displayTimestampUtc } from '@/app/utils/date';

const TRUNCATE_TOKEN_LENGTH = 10;
const MAX_TOKEN_NUMBER = 25;
const ALL_TOKENS = '';

type InstructionType = {
    name: string;
    innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
};

export function TokenHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const ownedTokens = useAccountOwnedTokens(address);
    const fetchAccountTokens = useFetchAccountOwnedTokens();
    const refresh = () => fetchAccountTokens(pubkey);
    
    // Fetch owned tokens
    React.useEffect(() => {
        if (!ownedTokens) refresh();
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    if (ownedTokens === undefined ) {
        return null;
    }

    const tokens = ownedTokens.data?.tokens;
    if (tokens === undefined || tokens.length === 0) return null;

    const filteredTokens = tokens?.filter(f => f.type === "buyNow");
    const slicedArray = filteredTokens.slice(0, MAX_TOKEN_NUMBER);

    if (slicedArray.length > MAX_TOKEN_NUMBER) {
        const text = `Token transaction history is not available for accounts with over ${MAX_TOKEN_NUMBER} token accounts`;
        return <ErrorCard text={text}/>;
    }

    return <TokenHistoryTable tokens={slicedArray} />;
}

const useQueryFilter = (): string => {
    const searchParams = useSearchParams();
    const filter = searchParams?.get('filter');
    return filter || '';
};

type FilterProps = {
    filter: string;
    toggle: () => void;
    show: boolean;
    tokens: TokenHistory[];
};

function TokenHistoryTable({ tokens }: { tokens: TokenHistory[] }) {
    const accountHistories = useAccountHistories();
    // const fetchAccountHistory = useFetchAccountHistory();
    const transactionDetailsCache = useTransactionDetailsCache();
    const [showDropdown, setDropdown] = React.useState(false);
    const filter = useQueryFilter();

    const filteredTokens = React.useMemo(
        () =>
            tokens.filter(token => {
                if (filter === ALL_TOKENS) {
                    return true;
                }
                return token.tokenMint === filter;
            }),
        [tokens, filter]
    );

    console.log("Filtered tokens: ", filteredTokens)

    // const fetchHistories = React.useCallback(
    //     (refresh?: boolean) => {
    //         filteredTokens.forEach(token => {
    //             fetchAccountHistory(token.buyer, refresh);
    //         });
    //     },
    //     [filteredTokens, fetchAccountHistory]
    // );

    // // Fetch histories on load
    // React.useEffect(() => {
    //     filteredTokens.forEach(token => {
    //         const address = token.buyer;
    //         if (!accountHistories[address]) {
    //             fetchAccountHistory(token.buyer, true);
    //         }
    //     });
    // }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // const allFoundOldest = filteredTokens.every(token => {
    //     const history = accountHistories[token.buyer];
    //     return history?.data?.foundOldest === true;
    // });

    // const allFetchedSome = filteredTokens.every(token => {
    //     const history = accountHistories[token.buyer];
    //     return history?.data !== undefined;
    // });

    // const fetching = filteredTokens.some(token => {
    //     const history = accountHistories[token.buyer];
    //     return history?.status === FetchStatus.Fetching;
    // });

    // const failed = filteredTokens.some(token => {
    //     const history = accountHistories[token.buyer];
    //     return history?.status === FetchStatus.FetchFailed;
    // });


    // React.useEffect(() => {
    //     if (!fetching && mintAndTxs.length < 1 && !allFoundOldest) {
    //         fetchHistories();
    //     }
    // }, [fetching, , allFoundOldest, fetchHistories]);

    // if (mintAndTxs.length === 0) {
    //     if (fetching) {
    //         return <LoadingCard message="Loading history" />;
    //     } else if (failed) {
    //         return <ErrorCard retry={() => fetchHistories(true)} text="Failed to fetch transaction history" />;
    //     }
    //     return (
    //         <ErrorCard retry={() => fetchHistories(true)} retryText="Try again" text="No transaction history found" />
    //     );
    // }

    // const filteredMintAndTxs = mintAndTxs.filter((item, index, array) => {
    //   // Check if the current item's slot is different from all previous items
    //   return array.findIndex((prevItem) => prevItem.tx.slot == item.tx.slot) === index;
    // });
    
    // console.log("mintAndTxs: ", mintAndTxs);
    // console.log("filteredData: ", filteredMintAndTxs);

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Token History</h3>
            </div>

            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">Slot</th>
                            <th className="text-muted w-1">Timestamp</th>
                            <th className="text-muted">Price (SOL)</th>
                            <th className="text-muted">Token</th>
                            <th className="text-muted">Source</th>
                            <th className="text-muted">Transaction Signature</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {filteredTokens.map(( token, index ) => (
                            <TokenTransactionRow
                                key={index}
                                slot={token.slot}
                                timestamp={token.blockTime}
                                tokenMint={token.tokenMint}
                                price={token.price}
                                signature={token.signature}
                                source={token.source}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


const TokenTransactionRow = React.memo(function TokenTransactionRow({
    key,
    slot,
    timestamp,
    tokenMint,
    price,
    signature,
    source
}: {
    key: number;
    slot: number;
    timestamp: number,
    tokenMint: string;
    price: number;
    signature: string;
    source: string;
}) {

    return (
        <tr key={key}>
            <td className="w-1">
                <Slot slot={slot} link />
            </td>
            <td className="text-muted">
                {timestamp ? displayTimestampUtc(timestamp * 1000, true) : '---'}
            </td>
            <td>
                {price}
            </td>
            <td>
                <Signature signature={tokenMint} link truncateChars={30}/>
            </td>
            <td>
                {source}
            </td>
            <td>
                <Signature signature={signature} link truncateChars={30}/>
            </td>
        </tr>
    );
});


// function formatTokenName(pubkey: string, cluster: Cluster, tokenRegistry: TokenInfoMap): string {
//     let display = displayAddress(pubkey, cluster, tokenRegistry);

//     if (display === pubkey) {
//         display = display.slice(0, TRUNCATE_TOKEN_LENGTH) + '\u2026';
//     }

//     return display;
// }
