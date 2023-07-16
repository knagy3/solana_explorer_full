import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { useTokenRegistry } from '@providers/mints/token-registry';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedMessageAccount, PublicKey, TokenAmount, TokenBalance } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useState } from 'react';

export type TokenBalanceRow = {
    account: PublicKey;
    mint: string;
    balance: TokenAmount;
    owner: string | undefined;
    delta: BigNumber;
    accountIndex: number;
};

export type OwnerType = {
  owner: string | undefined;
};



export function TokenBalancesCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { tokenRegistry } = useTokenRegistry();
    const [owner, setOwner] = useState<OwnerType>();

    if (!details) {
        return null;
    }

    const transactionWithMeta = details.data?.transactionWithMeta;
    const preTokenBalances = transactionWithMeta?.meta?.preTokenBalances;
    const postTokenBalances = transactionWithMeta?.meta?.postTokenBalances;
    const accountKeys = transactionWithMeta?.transaction.message.accountKeys;

    if (!preTokenBalances || !postTokenBalances || !accountKeys) {
        return null;
    }

    const rows = generateTokenBalanceRows(preTokenBalances, postTokenBalances, accountKeys);

    if (rows.length < 1) {
        return null;
    }

    const accountRows = rows.map(({ account, delta, balance, owner, mint }) => {
        const key = account.toBase58() + mint;
        const units = tokenRegistry.get(mint)?.symbol || 'tokens';
        return (
            <tr key={key}>
                <td>
                    <Address pubkey={account} link />
                </td>
                {owner &&
                  <td>
                    <Address pubkey={new PublicKey(owner)} link={true} raw={true} />
                  </td>
                }
                <td>
                    <Address pubkey={new PublicKey(mint)} link />
                </td>
                <td>
                    <BalanceDelta delta={delta} />
                </td>
                <td>
                    {balance.uiAmountString} {units}
                </td>
            </tr>
        );
    });

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">Token Balance Change</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Address</th>
                            <th className="text-muted">Owner</th>
                            <th className="text-muted">Token</th>
                            <th className="text-muted">Change</th>
                            <th className="text-muted">Post Balance</th>
                        </tr>
                    </thead>
                    <tbody className="list">{accountRows}</tbody>
                </table>
            </div>
        </div>
    );
}

export function generateTokenBalanceRows(
    preTokenBalances: TokenBalance[],
    postTokenBalances: TokenBalance[],
    accounts: ParsedMessageAccount[]
): TokenBalanceRow[] {
    const preBalanceMap: { [index: number]: TokenBalance } = {};
    const postBalanceMap: { [index: number]: TokenBalance } = {};

    preTokenBalances.forEach(balance => (preBalanceMap[balance.accountIndex] = balance));
    postTokenBalances.forEach(balance => (postBalanceMap[balance.accountIndex] = balance));

    console.log("postBalanceMap: ", postBalanceMap)

    // Check if any pre token balances do not have corresponding
    // post token balances. If not, insert a post balance of zero
    // so that the delta is displayed properly
    for (const index in preBalanceMap) {
        const preBalance = preBalanceMap[index];
        if (!postBalanceMap[index]) {
            postBalanceMap[index] = {
                accountIndex: Number(index),
                mint: preBalance.mint,
                uiTokenAmount: {
                    amount: '0',
                    decimals: preBalance.uiTokenAmount.decimals,
                    uiAmount: null,
                    uiAmountString: '0',
                },
            };
        }
    }

    const rows: TokenBalanceRow[] = [];

    for (const index in postBalanceMap) {
        const { uiTokenAmount, accountIndex, mint, owner } = postBalanceMap[index];
        const preBalance = preBalanceMap[accountIndex];
        const account = accounts[accountIndex].pubkey;


        // if(mint.match("So1")) {
        //   owner = mint;
        // }

        if (!uiTokenAmount.uiAmountString) {
            // uiAmount deprecation
            continue;
        }

        // case where mint changes
        if (preBalance && preBalance.mint !== mint) {
            if (!preBalance.uiTokenAmount.uiAmountString) {
                // uiAmount deprecation
                continue;
            }

            rows.push({
                account: accounts[accountIndex].pubkey,
                accountIndex,
                balance: {
                    amount: '0',
                    decimals: preBalance.uiTokenAmount.decimals,
                    uiAmount: 0,
                },
                owner :owner,
                delta: new BigNumber(-preBalance.uiTokenAmount.uiAmountString),
                mint: preBalance.mint,
            });

            rows.push({
                account: accounts[accountIndex].pubkey,
                accountIndex,
                balance: uiTokenAmount,
                owner: owner,
                delta: new BigNumber(uiTokenAmount.uiAmountString),
                mint: mint,
            });
            continue;
        }

        let delta;

        if (preBalance) {
            if (!preBalance.uiTokenAmount.uiAmountString) {
                // uiAmount deprecation
                continue;
            }

            delta = new BigNumber(uiTokenAmount.uiAmountString).minus(preBalance.uiTokenAmount.uiAmountString);
        } else {
            delta = new BigNumber(uiTokenAmount.uiAmountString);
        }

        rows.push({
            account,
            accountIndex,
            balance: uiTokenAmount,
            owner,
            delta,
            mint,
        });
    }

    return rows.sort((a, b) => a.accountIndex - b.accountIndex);
}
