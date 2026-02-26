import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { sites } from '../data';

export default function SiteUpdatePage() {
  const { siteId } = useParams();
  const site = sites.find((item) => item.id === siteId) ?? sites[0];

  return (
    <AppShell>
      <section className="content">
        <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
        <p className="subtitle">
          {site.code} | {site.legacyCode}
        </p>

        <article className="card form-card">
          <div className="card-head">
            <h2>SITE PROFILE</h2>
            <span>⋮</span>
          </div>

          <form className="form-grid">
            <input placeholder="Tanggal expired" defaultValue={site.contractEnd} />
            <input placeholder="Harga existing" defaultValue={site.existingPricePerYear} />
            <input placeholder="Harga baru" defaultValue={site.newPricePerYear} />
            <input placeholder="Jangka waktu sewa baru" defaultValue="5 tahun" />
            <div className="split-inputs">
              <input placeholder="Growth" defaultValue={site.growth} />
              <input placeholder="IRR" defaultValue="14%" />
            </div>
            <textarea placeholder="Histori nego" defaultValue="Diskusi awal selesai, menunggu approval final." />
          </form>
        </article>

        <button className="primary-btn" type="button">
          SUBMIT
        </button>
        <Link className="back-link" to={`/site/${site.id}`}>
          ← Back to profile
        </Link>
      </section>
    </AppShell>
  );
}
