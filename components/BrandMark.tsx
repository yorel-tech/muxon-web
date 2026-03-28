import Image from 'next/image';
import { cn } from '@/lib/utils';

const BRAND_SRC = '/android-chrome-192x192.png';

export type BrandMarkProps = {
  className?: string;
  /** Logical display size in pixels */
  size?: number;
  priority?: boolean;
};

export function BrandMark({ className, size = 32, priority = false }: BrandMarkProps) {
  return (
    <Image
      src={BRAND_SRC}
      alt="Infron"
      width={size}
      height={size}
      className={cn('flex-shrink-0 object-contain', className)}
      priority={priority}
    />
  );
}
