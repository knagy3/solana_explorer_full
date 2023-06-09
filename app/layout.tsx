import './scss/theme-dark.scss';

import { ClusterModal } from '@components/ClusterModal';
import { ClusterStatusBanner } from '@components/ClusterStatusButton';
import { MessageBanner } from '@components/MessageBanner';
import { Navbar } from '@components/Navbar';
import { SearchBar } from '@components/SearchBar';
import { AccountsProvider } from '@providers/accounts';
import { BlockProvider } from '@providers/block';
import { ClusterProvider } from '@providers/cluster';
import { EpochProvider } from '@providers/epoch';
import { MintsProvider } from '@providers/mints';
import { RichListProvider } from '@providers/richList';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { StatsProvider } from '@providers/stats';
import { SupplyProvider } from '@providers/supply';
import { TransactionsProvider } from '@providers/transactions';
import { Rubik } from 'next/font/google';
import { Metadata } from 'next/types';

export const metadata: Metadata = {
    description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
    manifest: '/manifest.json',
    title: 'Fabis | Solana | Tool',
    viewport: {
        initialScale: 1,
        maximumScale: 1,
        width: 'device-width',
    },
};

const rubikFont = Rubik({
    display: 'swap',
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

export default function RootLayout({
    analytics,
    children,
}: {
    analytics?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${rubikFont.variable}`}>
            <body>
                <ScrollAnchorProvider>
                    <ClusterProvider>
                        <StatsProvider>
                            <SupplyProvider>
                                <RichListProvider>
                                    <AccountsProvider>
                                        <BlockProvider>
                                            <EpochProvider>
                                                <MintsProvider>
                                                    <TransactionsProvider>
                                                        <ClusterModal />
                                                        <div className="main-content pb-4">
                                                            <Navbar />
                                                            <MessageBanner />
                                                            <ClusterStatusBanner />
                                                            <SearchBar />
                                                            {children}
                                                        </div>
                                                    </TransactionsProvider>
                                                </MintsProvider>
                                            </EpochProvider>
                                        </BlockProvider>
                                    </AccountsProvider>
                                </RichListProvider>
                            </SupplyProvider>
                        </StatsProvider>
                    </ClusterProvider>
                </ScrollAnchorProvider>
                {analytics}
            </body>
        </html>
    );
}
