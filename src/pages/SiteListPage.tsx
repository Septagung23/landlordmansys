import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../auth';
import AppShell from '../components/AppShell';
import SiteCard from '../components/SiteCard';
import type { Site } from '../types';

type SortDirection = 'asc' | 'desc';
const SITES_PER_PAGE = 6;

export default function SiteListPage() {
  const { token } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sitePage, setSitePage] = useState(1);

  useEffect(() => {
    async function fetchSites() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiFetch('/api/sites', { token });
        if (!response.ok) {
          throw new Error('Failed to fetch sites.');
        }
        const payload = (await response.json()) as Site[];
        setSites(payload);
      } catch {
        setErrorMessage('Failed to load sites. Please check backend server status.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSites();
  }, [token]);

  const visibleSites = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...sites]
      .filter((site) => {
        if (!normalizedSearch) {
          return true;
        }

        return site.code.toLowerCase().includes(normalizedSearch);
      })
      .sort((leftSite, rightSite) => {
        const comparison = leftSite.code.localeCompare(rightSite.code, undefined, {
          numeric: true,
          sensitivity: 'base'
        });

        return sortDirection === 'asc' ? comparison : comparison * -1;
      });
  }, [searchTerm, sites, sortDirection]);

  const totalSitePages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleSites.length / SITES_PER_PAGE));
  }, [visibleSites]);

  const paginatedSites = useMemo(() => {
    const startIndex = (sitePage - 1) * SITES_PER_PAGE;
    const endIndex = startIndex + SITES_PER_PAGE;

    return visibleSites.slice(startIndex, endIndex);
  }, [sitePage, visibleSites]);

  useEffect(() => {
    setSitePage(1);
  }, [searchTerm, sortDirection]);

  useEffect(() => {
    if (sitePage > totalSitePages) {
      setSitePage(totalSitePages);
    }
  }, [sitePage, totalSitePages]);

  return (
    <AppShell>
      <section className="content">
        <div className="list-toolbar">
          <label className="toolbar-field">
            <span>Search site code</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Type a site code"
            />
          </label>

          <label className="toolbar-field toolbar-sort">
            <span>Sort site code</span>
            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
          </label>
        </div>

        {isLoading ? <p>Loading sites...</p> : null}
        {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}
        {!isLoading && !errorMessage ? (
          <>
            <div className="list-stack">
              {visibleSites.length === 0 ? (
                <p className="list-empty">No sites match that site code.</p>
              ) : null}
              {paginatedSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>

            {visibleSites.length > 0 ? (
              <div className="list-pagination" aria-label="Site list pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setSitePage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={sitePage === 1}
                >
                  Previous
                </button>
                <p className="pagination-status">
                  Page {sitePage} of {totalSitePages}
                </p>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() =>
                    setSitePage((currentPage) => Math.min(totalSitePages, currentPage + 1))
                  }
                  disabled={sitePage === totalSitePages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
