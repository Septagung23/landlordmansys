import { FormEvent, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { sites } from '../data';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function SiteUpdatePage() {
  const { siteId } = useParams();
  const site = sites.find((item) => item.id === siteId) ?? sites[0];

  const [existingPricePerYear, setExistingPricePerYear] = useState(site.existingPricePerYear);
  const [newPricePerYear, setNewPricePerYear] = useState(site.newPricePerYear);
  const [negotiationHistory, setNegotiationHistory] = useState(site.negotiationHistory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      const response = await fetch(`${apiBaseUrl}/api/sites/${site.id}/lease`, {
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
    } catch {
      setStatusMessage('Failed to update lease data. Please check backend server status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="content">
        <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
        <p className="subtitle">
          {site.code} | {site.legacyCode}
        </p>

        <article className="card form-card">
          <div className="card-head">
            <h2>EDIT SITE PROFILE</h2>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <input placeholder="Tanggal expired" defaultValue={site.contractEnd} />
            <input
              placeholder="Harga existing"
              type="number"
              value={existingPricePerYear}
              onChange={(event) => setExistingPricePerYear(Number(event.target.value))}
            />
            <input
              placeholder="Harga baru"
              type="number"
              value={newPricePerYear}
              onChange={(event) => setNewPricePerYear(Number(event.target.value))}
            />
            <input placeholder="Jangka waktu sewa baru" defaultValue="5 tahun" />
            <div className="split-inputs">
              <input placeholder="Growth" disabled value={growth} />
              <input placeholder="IRR" disabled defaultValue="14%" />
            </div>
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
          ← Back to profile
        </Link>
      </section>
    </AppShell>
  );
}
