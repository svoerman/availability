import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ComponentPropsWithoutRef<typeof Image> {
  wrapperClassName?: string;
}

export function OptimizedImage({
  alt,
  src,
  width,
  height,
  wrapperClassName,
  className,
  priority = false,
  ...props
}: OptimizedImageProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Image
        className={cn('object-cover', className)}
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={90}
        priority={priority}
        {...props}
      />
    </div>
  );
}

// Example usage:
// <OptimizedImage
//   src="/path/to/image.jpg"
//   alt="Description"
//   width={800}
//   height={600}
//   priority // Use for LCP images
//   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
// />
