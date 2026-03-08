import AppShell from '../components/AppShell';
import SiteCard from '../components/SiteCard';
import { sites } from '../data';

export default function SiteListPage() {
  return (
    <AppShell>
      <section className="content">
        <div className="list-stack">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
