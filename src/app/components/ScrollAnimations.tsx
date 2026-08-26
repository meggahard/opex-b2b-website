'use client';
import { useEffect } from 'react';

export default function ScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ? parseFloat(el.dataset.delay) : 0;
            setTimeout(() => {
              el.classList.add('visible');
            }, delay * 1000);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const items = document.querySelectorAll('.reveal-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return null;
}
