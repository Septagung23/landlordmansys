import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import type { Site } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const profileFields: Array<{ label: string; key: keyof Site }> = [
  { label: 'Negotiator', key: 'negotiator' },
  { label: 'Province', key: 'province' },
  { label: 'Existing Price / year', key: 'existingPricePerYear' },
  { label: 'New Price / year', key: 'newPricePerYear' },
  { label: 'Tower Type', key: 'towerType' },
  { label: 'Contract End', key: 'contractEnd' },
  { label: 'Landlord', key: 'll' },
  { label: 'Lat/Long', key: 'coordinates' },
  { label: 'Negotiation History', key: 'negotiationHistory' }
];

export default function SiteProfilePage() {
  const { siteId } = useParams();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSiteId = useMemo(() => siteId ?? '', [siteId]);

  useEffect(() => {
    async function fetchSiteProfile() {
      if (!selectedSiteId) {
        setErrorMessage('Site id is missing in the URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`${apiBaseUrl}/api/sites/${selectedSiteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch site profile data.');
        }

        const payload = (await response.json()) as Site;
        setSite(payload);
      } catch {
        setErrorMessage('Failed to fetch site profile data. Please check backend server status.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSiteProfile();
  }, [selectedSiteId]);

  return (
    <AppShell>
      <section className="content">
        {isLoading ? <p>Loading site profile...</p> : null}
        {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}
        {!isLoading && !errorMessage && site ? (
          <>
            <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
            <p className="subtitle">
              {site.code} | {site.legacyCode}
            </p>

            <article className="card profile-card">
              <div className="card-head">
                <h2>SITE PROFILE</h2>
                <Link to={`/site/${site.id}/update`}>
                  <span>Edit</span>
                </Link>
              </div>

              <div className="profile-grid">
                {profileFields.map((field) => (
                  <div className="profile-row" key={field.key}>
                    <p className="cell label">{field.label}</p>
                    <p className="cell">{site[field.key]}</p>
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : null}

        {/* <Link className="primary-btn" to={`/site/${selectedSiteId}/update`}>
          CONTINUE TO EDIT
        </Link> */}
      </section>
    </AppShell>
  );
}
