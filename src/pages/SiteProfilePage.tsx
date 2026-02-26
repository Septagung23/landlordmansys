import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { profileFields, sites } from '../data';

export default function SiteProfilePage() {
  const { siteId } = useParams();
  const site = sites.find((item) => item.id === siteId) ?? sites[0];

  return (
    <AppShell>
      <section className="content">
        <h1 className="page-title smaller">{site.id.toUpperCase()}</h1>
        <p className="subtitle">
          {site.code} | {site.legacyCode}
        </p>

        <article className="card profile-card">
          <div className="card-head">
            <h2>SITE PROFILE</h2>
            <span>⋮</span>
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

        <Link className="primary-btn" to={`/site/${site.id}/update`}>
          CONTINUE TO EDIT
        </Link>
      </section>
    </AppShell>
  );
}
