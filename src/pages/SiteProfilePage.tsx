import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth';
import AppShell from '../components/AppShell';
import type { Site } from '../types';
import { ArrowLeft } from 'lucide-react';

type ProfileField = {
    label: string;
    getValue: (site: Site) => string | number;
};
const DEFAULT_IRR = '14%';
const COMMENTS_PER_PAGE = 5;

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(value);
}
function formatDateTime(isoDateTime: string) {
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function formatPercentage(value: number) {
    return `${value.toFixed(2)}%`;
}
function calculateGrowth(existingPricePerYear: number, newPricePerYear: number) {
    if (existingPricePerYear === 0) {
        return 0;
    }

    return ((newPricePerYear - existingPricePerYear) / existingPricePerYear) * 100;
}

export default function SiteProfilePage() {
    const { siteCode } = useParams();
    const { token } = useAuth();
    const [site, setSite] = useState<Site | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [commentPage, setCommentPage] = useState(1);

    const selectedSiteCode = useMemo(() => siteCode ?? '', [siteCode]);

    const totalNewPrice = useMemo(() => {
        if (!site) {
            return formatCurrency(0);
        }

        return formatCurrency(site.newPricePerYear * 5);
    }, [site]);
    const totalGrowth = useMemo(() => {
        if (!site) {
            return formatPercentage(0);
        }

        return formatPercentage(calculateGrowth(site.existingPricePerYear, site.newPricePerYear));
    }, [site]);

    const profileFields = useMemo<ProfileField[]>(() => {
        if (!site) {
            return [];
        }

        return [
            { label: 'Negotiator', getValue: (currentSite) => currentSite.negotiator },
            { label: 'Province', getValue: (currentSite) => currentSite.province },
            {
                label: 'Existing Price / year',
                getValue: (currentSite) => formatCurrency(currentSite.existingPricePerYear)
            },
            {
                label: 'New Price / year',
                getValue: (currentSite) => formatCurrency(currentSite.newPricePerYear)
            },
            { label: 'Total New Price', getValue: () => totalNewPrice },
            { label: 'Growth', getValue: () => totalGrowth },
            { label: 'IRR', getValue: () => DEFAULT_IRR },
            { label: 'Tower Type', getValue: (currentSite) => currentSite.towerType },
            { label: 'Contract End', getValue: (currentSite) => currentSite.contractEnd },
            { label: 'Landlord', getValue: (currentSite) => currentSite.ll },
            { label: 'Landlord Address', getValue: (currentSite) => currentSite.landlordAddress },
            { label: 'Contact', getValue: (currentSite) => currentSite.contact },
            { label: 'Old Lease Time', getValue: (currentSite) => currentSite.oldLeaseTime },
            { label: 'New Lease Time', getValue: (currentSite) => currentSite.newLeaseTime },
            { label: 'Lat/Long', getValue: (currentSite) => currentSite.coordinates }
        ];

    }, [site, totalGrowth, totalNewPrice]);

    //Comment Section
    const totalCommentPages = useMemo(() => {
        if (!site) {
            return 1;
        }

        return Math.max(1, Math.ceil(site.negotiationComments.length / COMMENTS_PER_PAGE));
    }, [site]);
    const paginatedComments = useMemo(() => {
        if (!site) {
            return [];
        }

        const startIndex = (commentPage - 1) * COMMENTS_PER_PAGE;
        const endIndex = startIndex + COMMENTS_PER_PAGE;

        return site.negotiationComments.slice(startIndex, endIndex);
    }, [commentPage, site]);

    useEffect(() => {
        async function fetchSiteProfile() {
            if (!selectedSiteCode) {
                setErrorMessage('Site code is missing in the URL.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await apiFetch(`/api/sites/${selectedSiteCode}`, { token });
                if (!response.ok) {
                    throw new Error('Failed to fetch site profile data.');
                }

                const payload = (await response.json()) as Site;
                setSite(payload);
                setCommentPage(1);
            } catch {
                setErrorMessage('Failed to fetch site profile data. Please check backend server status.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSiteProfile();
    }, [selectedSiteCode, token]);

    useEffect(() => {
        if (commentPage > totalCommentPages) {
            setCommentPage(totalCommentPages);
        }
    }, [commentPage, totalCommentPages]);

    return (
        <AppShell>
            <section className="content">
                {isLoading ? <p>Loading site profile...</p> : null}
                {!isLoading && errorMessage ? 
                    <div className='error-msg'>
                        <p>{errorMessage}</p> 
                        <a href='/' className='back-home'>
                            <ArrowLeft size={12}/>
                            Back
                        </a>
                    </div>
                : null}

                {!isLoading && !errorMessage && site ? (
                    <>
                        <a href='/' className='back-home'>
                            <ArrowLeft size={12}/>
                            Back
                        </a>
                        <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
                        <p className="subtitle">
                            {site.code} | {site.legacyCode}
                        </p>

                        <article className="card profile-card">
                            <div className="card-head">
                                <h2>SITE PROFILE</h2>
                                <Link to={`/site/${site.code}/update`}>
                                    <span>Update</span>
                                </Link>
                            </div>

                            <div className="profile-grid">
                                {profileFields.map((field) => (
                                    <div className="profile-row" key={field.label}>
                                        <p className="cell label">{field.label}</p>
                                        <p className="cell">{field.getValue(site)}</p>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="card profile-card comments-card">
                            <div className="card-head">
                                <h2>NEGOTIATION COMMENTS</h2>
                            </div>

                            <div className="comments-list">
                                {site.negotiationComments.length === 0 ? (
                                    <p className="empty-comments">No negotiation updates yet.</p>
                                ) : (
                                    paginatedComments.map((entry) => (
                                        <div className="comment-entry" key={entry.id}>
                                            <p>
                                                <strong>New Price:</strong> {formatCurrency(entry.newPricePerYear)}
                                            </p>
                                            <p>
                                                <strong>Growth:</strong> {entry.growth.toFixed(2)}%
                                            </p>
                                            <p>
                                                <strong>Date Time:</strong> {formatDateTime(entry.editedAt)}
                                            </p>
                                            <p>
                                                <strong>Edited By:</strong> {entry.editedBy}
                                            </p>
                                            <p>
                                                <strong>Negotiation History:</strong> {entry.note || '-'}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {site.negotiationComments.length > 0 ? (
                                <div className="comments-pagination" aria-label="Negotiation comment pagination">
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={() => setCommentPage((currentPage) => Math.max(1, currentPage - 1))}
                                        disabled={commentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <p className="pagination-status">
                                        Page {commentPage} of {totalCommentPages}
                                    </p>
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={() =>
                                            setCommentPage((currentPage) => Math.min(totalCommentPages, currentPage + 1))
                                        }
                                        disabled={commentPage === totalCommentPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            ) : null}
                        </article>
                    </>
                ) : null}

                {/* <Link className="primary-btn" to={`/site/${selectedSiteCode}/update`}>
          CONTINUE TO EDIT
        </Link> */}
            </section>
        </AppShell>
    );
}
