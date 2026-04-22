import React from 'react';
import { Flame, Video, Zap } from 'lucide-react';
import { AssetCategory } from '@/types';
import { cn } from '@/lib/utils';

type IconProps = {
  category: AssetCategory | string;
  size?: number;
  className?: string;
};

function SmokeDetectionIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 5.5h14v4H5z" />
      <path d="M7 9.5v3.2l3 2.8h4l3-2.8V9.5" />
      <path d="M8.5 17.5c1 .9 2.2 1.4 3.5 1.4s2.5-.5 3.5-1.4" />
      <path d="M7 20c1.4 1.4 3.1 2 5 2s3.6-.6 5-2" />
    </svg>
  );
}

function DropletIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.5c-3.1 3.9-5.5 6.9-5.5 10A5.5 5.5 0 0 0 12 19a5.5 5.5 0 0 0 5.5-5.5c0-3.1-2.4-6.1-5.5-10Z" />
      <path d="M9.6 14.1c.4 1.2 1.3 1.9 2.4 2.3" />
    </svg>
  );
}

export function AssetCategoryIcon({ category, size = 18, className }: IconProps) {
  const sharedClassName = cn(className);

  if (category === 'Rivelazione incendi') {
    return <SmokeDetectionIcon size={size} className={cn('text-red-500', sharedClassName)} />;
  }

  if (category === 'Meccanico') {
    return <DropletIcon size={size} className={cn('text-blue-500', sharedClassName)} />;
  }

  if (category === 'Elettrico') {
    return <Zap size={size} className={cn('text-orange-500', sharedClassName)} />;
  }

  if (category === 'TVCC') {
    return <Video size={size} className={cn('text-purple-500', sharedClassName)} />;
  }

  return <Flame size={size} className={cn('text-rose-500', sharedClassName)} />;
}
