/* eslint-disable @typescript-eslint/no-redeclare */

import { PublicKeyFromString } from '@validators/pubkey';
import { any, array, boolean, enums, Infer, nullable, number, optional, string, type } from 'superstruct';

export type RaffleAccountType = Infer<typeof RaffleAccountType>;
export const RaffleAccountType = enums(['mint', 'account', 'multisig']);

export type RaffleAccountState = Infer<typeof AccountState>;
const AccountState = enums(['initialized', 'uninitialized', 'frozen']);

export type RaffleAccountInfo = Infer<typeof RaffleAccountInfo>;
export const RaffleAccountInfo = type({
  blockTime: number(),
  blockId: number(),
  transactionId: string(),
  instructionOrdinal: number(),
  transactionPosition: number(),
  userAccount: string(),
  event: string(),
  raffleAccount: nullable(string()),
  raffleOwner: nullable(string()),
  rafflePaymentAmount: nullable(number()),
  rafflePaymentMint: nullable(string()),
  numberoftickets: nullable(number()),
  raffleEarningsAmount: nullable(number()),
  raffleFeesAmount: nullable(number()),
  prizeMint: nullable(string()),
  totalTickets: nullable(number()),
  pricePerTicket: nullable(number()),
  raffleEndTime: nullable(number()),
  winnerAccount: nullable(string()),
});

export type MintAccountInfo = Infer<typeof MintAccountInfo>;
export const MintAccountInfo = type({
    decimals: number(),
    freezeAuthority: nullable(PublicKeyFromString),
    isInitialized: boolean(),
    mintAuthority: nullable(PublicKeyFromString),
    supply: string(),
});

export type MultisigAccountInfo = Infer<typeof MultisigAccountInfo>;
export const MultisigAccountInfo = type({
    isInitialized: boolean(),
    numRequiredSigners: number(),
    numValidSigners: number(),
    signers: array(PublicKeyFromString),
});

export type RaffleAccount = Infer<typeof RaffleAccount>;
export const RaffleAccount = type({
    info: any(),
    type: RaffleAccountType,
});
