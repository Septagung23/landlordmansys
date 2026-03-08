import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import type { Site } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function SiteUpdatePage() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingPricePerYear, setExistingPricePerYear] = useState(0);
  const [newPricePerYear, setNewPricePerYear] = useState(0);
  const [negotiationHistory, setNegotiationHistory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSite() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch(`${apiBaseUrl}/api/sites/${siteId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch site data.');
        }

        const siteData: Site = await response.json();
        setSite(siteData);
        setExistingPricePerYear(siteData.existingPricePerYear);
        setNewPricePerYear(siteData.newPricePerYear);
        setNegotiationHistory(siteData.negotiationHistory);
      } catch (error) {
        setLoadError('Failed to load site data. Please check backend server status.');
      } finally {
        setIsLoading(false);
      }
    }

    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const growth = useMemo(() => {
    if (existingPricePerYear === 0) {
      return '0.00%';
    }
    return `${(((newPricePerYear - existingPricePerYear) / existingPricePerYear) * 100).toFixed(2)}%`;
  }, [existingPricePerYear, newPricePerYear]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/sites/${siteId}/lease`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          existingPricePerYear,
          newPricePerYear,
          negotiationHistory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lease data.');
      }

      setStatusMessage('Lease data updated successfully.');
      navigate(`/site/${siteId}`);
    } catch {
      setStatusMessage('Failed to update lease data. Please check backend server status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="content">
        {isLoading && <p>Loading site data...</p>}
        {loadError && <p style={{ color: 'red' }}>{loadError}</p>}
        {site && (
          <>
            <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
            <p className="subtitle">
              {site.code} | {site.legacyCode}
            </p>

            <article className="card form-card">
              <div className="card-head">
                <h2>EDIT SITE PROFILE</h2>
              </div>

              <form className="form-grid" onSubmit={handleSubmit}>
                <label htmlFor="Tanggal expired">Tanggal expired</label>
                <input placeholder="Tanggal expired" defaultValue={site.contractEnd} />
                <label htmlFor="Harga existing">Harga existing</label>
                <input
                  placeholder="Harga existing"
                  type="number"
                  value={existingPricePerYear}
                  onChange={(event) => setExistingPricePerYear(Number(event.target.value))}
                />
                <label htmlFor="Harga baru">Harga baru</label>
                <input
                  placeholder="Harga baru"
                  type="number"
                  value={newPricePerYear}
                  onChange={(event) => setNewPricePerYear(Number(event.target.value))}
                />
                <label htmlFor="Jangka waktu sewa baru">Jangka waktu sewa baru</label>
                <input placeholder="Jangka waktu sewa baru" defaultValue="5 tahun" />
                <div className="split-inputs">
                  <div>
                    <label htmlFor="Growth">Growth</label>
                    <input placeholder="Growth" disabled value={growth} />
                  </div>
                  <div>
                    <label htmlFor="IRR">IRR</label>
                    <input placeholder="IRR" disabled defaultValue="14%" />
                  </div>
                </div>
                <label htmlFor="Histori nego">Histori Negosiasi</label>
                <textarea
                  placeholder="Histori nego"
                  value={negotiationHistory}
                  onChange={(event) => setNegotiationHistory(event.target.value)}
                />
                <button className="primary-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
                </button>
                {statusMessage ? <p>{statusMessage}</p> : null}
              </form>
            </article>

            <Link className="back-link" to={`/site/${site.id}`}>
              Cancel
            </Link>
          </>
        )}
      </section>
    </AppShell>
  );
}
