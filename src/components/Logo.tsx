import { MessageCircleHeart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <Link to="/" className={`font-extrabold ${sz} flex items-center gap-2`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-card">
        <MessageCircleHeart className="h-6 w-6" />
      </span>
      <span className="text-gradient">Social Connect</span>
    </Link>
  );
}
