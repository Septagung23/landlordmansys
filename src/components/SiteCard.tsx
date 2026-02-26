import { Link } from 'react-router-dom';
import type { Site } from '../types';

type SiteCardProps = {
  site: Site;
};

export default function SiteCard({ site }: SiteCardProps) {
  return (
    <Link className="site-card" to={`/site/${site.id}`}>
      <div className="site-avatar" />
      <div>
        <p className="site-title">{site.id.toUpperCase()}</p>
        <p className="site-code">
          {site.code} | {site.legacyCode}
        </p>
        <p className="site-pic">PIC: {site.pic}</p>
      </div>
    </Link>
  );
}
