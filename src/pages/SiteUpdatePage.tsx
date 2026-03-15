import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth';
import AppShell from '../components/AppShell';
import type { Site } from '../types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function parseCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly === '') {
    return {
      amount: 0,
      displayValue: ''
    };
  }

  const amount = Number(digitsOnly);

  return {
    amount,
    displayValue: formatCurrency(amount)
  };
}

export default function SiteUpdatePage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingPricePerYear, setExistingPricePerYear] = useState(0);
  const [newPricePerYear, setNewPricePerYear] = useState(0);
  const [existingPriceInput, setExistingPriceInput] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [contact, setContact] = useState('');
  const [oldLeaseTime, setOldLeaseTime] = useState('');
  const [newLeaseTime, setNewLeaseTime] = useState('');
  const [negotiationNote, setNegotiationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSite() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await apiFetch(`/api/sites/${siteId}`, { token });

        if (!response.ok) {
          throw new Error('Failed to fetch site data.');
        }

        const siteData: Site = await response.json();
        setSite(siteData);
        setExistingPricePerYear(siteData.existingPricePerYear);
        setNewPricePerYear(siteData.newPricePerYear);
        setExistingPriceInput(formatCurrency(siteData.existingPricePerYear));
        setNewPriceInput(formatCurrency(siteData.newPricePerYear));
        setLandlordAddress(siteData.landlordAddress);
        setContact(siteData.contact);
        setOldLeaseTime(siteData.oldLeaseTime ? String(siteData.oldLeaseTime) : '');
        setNewLeaseTime(siteData.newLeaseTime ? String(siteData.newLeaseTime) : '');
        setNegotiationNote('');
      } catch (error) {
        setLoadError('Failed to load site data. Please check backend server status.');
      } finally {
        setIsLoading(false);
      }
    }

    if (siteId) {
      fetchSite();
    }
  }, [siteId, token]);

  const growth = useMemo(() => {
    if (existingPricePerYear === 0) {
      return '0.00%';
    }
    return `${(((newPricePerYear - existingPricePerYear) / existingPricePerYear) * 100).toFixed(2)}%`;
  }, [existingPricePerYear, newPricePerYear]);

  function handleExistingPriceChange(value: string) {
    const { amount, displayValue } = parseCurrencyInput(value);
    setExistingPricePerYear(amount);
    setExistingPriceInput(displayValue);
  }

  function handleNewPriceChange(value: string) {
    const { amount, displayValue } = parseCurrencyInput(value);
    setNewPricePerYear(amount);
    setNewPriceInput(displayValue);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await apiFetch(`/api/sites/${siteId}/lease`, {
        method: 'PUT',
        body: JSON.stringify({
          existingPricePerYear,
          newPricePerYear,
          landlordAddress,
          contact,
          oldLeaseTime: oldLeaseTime ? Number(oldLeaseTime) : 0,
          newLeaseTime: newLeaseTime ? Number(newLeaseTime) : 0,
          negotiationNote
        }),
        token
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
                <input placeholder="Tanggal expired" defaultValue={site.contractEnd} disabled />
                <label htmlFor="Harga existing">Harga existing</label>
                <input
                  placeholder="Harga existing"
                  type="text"
                  inputMode="numeric"
                  value={existingPriceInput}
                  onChange={(event) => handleExistingPriceChange(event.target.value)}
                />
                <label htmlFor="Harga baru">Harga baru</label>
                <input
                  placeholder="Harga baru"
                  type="text"
                  inputMode="numeric"
                  value={newPriceInput}
                  onChange={(event) => handleNewPriceChange(event.target.value)}
                />
                <label htmlFor="Jangka waktu sewa baru">Jangka waktu sewa baru</label>
                <input placeholder="Jangka waktu sewa baru" defaultValue="5 tahun" />
                <label htmlFor="Total harga baru">Total harga baru</label>
                <input
                  placeholder="Total harga baru"
                  type="text"
                  disabled
                  value={formatCurrency(newPricePerYear * 5)}
                />
                <label htmlFor="Alamat landlord">Alamat landlord</label>
                <input
                  placeholder="Alamat landlord"
                  type="text"
                  value={landlordAddress}
                  onChange={(event) => setLandlordAddress(event.target.value)}
                />
                <label htmlFor="Kontak landlord">Kontak landlord</label>
                <input
                  placeholder="Kontak landlord"
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
                <label htmlFor="Masa sewa lama">Masa sewa lama</label>
                <input
                  placeholder="Masa sewa lama"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={oldLeaseTime}
                  onChange={(event) => setOldLeaseTime(event.target.value)}
                />
                <label htmlFor="Masa sewa baru">Masa sewa baru</label>
                <input
                  placeholder="Masa sewa baru"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={newLeaseTime}
                  onChange={(event) => setNewLeaseTime(event.target.value)}
                />
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
                  value={negotiationNote}
                  onChange={(event) => setNegotiationNote(event.target.value)}
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
