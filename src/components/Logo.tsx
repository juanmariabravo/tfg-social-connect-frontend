import { Link } from 'react-router-dom';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <Link to="/" className={`font-extrabold ${sz} flex items-center gap-2`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-card">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-gradient">Social Connect</span>
    </Link>
  );
}
