import { useEffect } from 'react';

export function PerformanceGovernor() {
  useEffect(() => {
    document.documentElement.classList.add('ultron-performance');
    const reduce = () => {
      const lowPower = (navigator as any).deviceMemory && Number((navigator as any).deviceMemory) <= 8;
      const cores = navigator.hardwareConcurrency || 4;
      document.documentElement.classList.toggle('ultron-low-power', lowPower || cores <= 4);
    };
    reduce();
    return () => {
      document.documentElement.classList.remove('ultron-performance', 'ultron-low-power');
    };
  }, []);
  return null;
}
