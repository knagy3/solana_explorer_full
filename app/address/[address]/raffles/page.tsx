import { RaffleTransactionHistoryCard } from '@components/account/raffle/RaffleTransactionHistoryCard';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata({ params: { address } }: Props): Promise<Metadata> {
    return {
        description: `All tokens owned by the address ${address} on Solana`,
        title: `Raffles | ${address} | Solana`,
    };
}

export default function OwnedRafflesPage({ params: { address } }: Props) {
    return <RaffleTransactionHistoryCard address={address} />
}
