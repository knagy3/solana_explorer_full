'use client';

import Logo from '@img/logos-solana/solana.svg';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React from 'react';

import { ClusterStatusButton } from './ClusterStatusButton';

export function Navbar() {
    // TODO: use `collapsing` to animate collapsible navbar
    const [collapse, setCollapse] = React.useState(false);
    const homePath = useClusterPath({ pathname: '/' });
    const supplyPath = useClusterPath({ pathname: '/supply' });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const selectedLayoutSegments = useSelectedLayoutSegments();
    return (
        <nav className="navbar navbar-expand-md navbar-light">
            <div className="container">
                <Link href={homePath}>
                    <Image alt="Fabis Solana Tool" height={22} src={Logo} width={50} />
                </Link>
                <div className='h2 mb-0'>
                    Fabi's Tool
                </div>

                <button className="navbar-toggler" type="button" onClick={() => setCollapse(value => !value)}>
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ms-auto me-4 ${collapse ? 'show' : ''}`}>
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link
                                className={`nav-link${selectedLayoutSegment === null ? ' active' : ''}`}
                                href={homePath}
                            >
                                Summary
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className={`nav-link${selectedLayoutSegment === 'supply' ? ' active' : ''}`}
                                href={supplyPath}
                            >
                                Account
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className={`nav-link${
                                    selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                                        ? ' active'
                                        : ''
                                }`}
                                href={"#"}
                                // href={inspectorPath}
                            >
                                All Accounts
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="d-none d-md-block">
                    <ClusterStatusButton />
                </div>
            </div>
        </nav>
    );
}
