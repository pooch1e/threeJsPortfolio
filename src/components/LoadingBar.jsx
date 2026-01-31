import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LoadingBar({ isLoading }) {
  const barRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!barRef.current || !containerRef.current) return;

    if (isLoading) {
      // Show container and animate bar
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Animate progress bar
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.inOut',
        }
      );
    } else {
      // Complete the bar quickly, then fade out
      gsap.to(barRef.current, {
        scaleX: 1,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
          });
        },
      });
    }
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-1 z-50 opacity-0 pointer-events-none">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left"
        style={{ transform: 'scaleX(0)' }}></div>
    </div>
  );
}
