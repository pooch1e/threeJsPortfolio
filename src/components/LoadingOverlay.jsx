import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LoadingOverlay({ isLoading = true, message = 'Loading...' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (isLoading) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isLoading]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/80 text-lg font-karrik">{message}</p>
      </div>
    </div>
  );
}
