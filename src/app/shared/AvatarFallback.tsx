import React, { useState } from 'react';

interface Props {
  name?: string | null;
  photo?: string | null;
  sizeClass?: string; // tailwind size classes e.g. 'h-12 w-12'
  alt?: string;
}

export default function AvatarFallback({ name, photo, sizeClass = 'h-12 w-12', alt }: Props) {
  const [showImage, setShowImage] = useState(Boolean(photo));
  const initials = (name || '').charAt(0).toUpperCase() || '';

  function getAvatarColor(nameStr?: string | null) {
    // simple deterministic color classes based on char code
    const colors = [
      'from-sky-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-pink-500 to-rose-600',
      'from-yellow-500 to-amber-600',
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-sky-600',
    ];
    const ch = (nameStr || 'U').charCodeAt(0) || 85;
    return colors[ch % colors.length];
  }

  const gradient = getAvatarColor(name);

  return (
    <div className={`relative ${sizeClass} overflow-hidden rounded-full border border-white/15 shadow-lg bg-slate-950 flex-shrink-0`}>
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradient} text-xl font-bold text-white`}>{initials}</div>
      {photo && showImage && (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img
          src={photo}
          alt={alt || name || 'Avatar'}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { setShowImage(false); (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}
