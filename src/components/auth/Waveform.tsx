'use client';

import { motion } from 'framer-motion';

type BarSize = 'sm' | 'md' | 'lg' | 'hero';

interface WaveformProps {
  className?: string;
  barColor?: string;
  animated?: boolean;
  size?: BarSize | 'logo';
}

interface BarConfig {
  id: string;
  height: number;
  sizeIndex: number;
}

// Pre-computed deterministic scaleY values to avoid Math.random() in render
const BAR_SCALE_VALUES = Array.from({ length: 30 }, (_, i) => [
  1,
  0.3 + (((i * 17 + 7) % 11) / 11) * 0.7,
  0.8,
  0.2 + (((i * 13 + 5) % 9) / 9) * 0.8,
  1,
]);

// Static bar configs with stable ids — avoids noArrayIndexKey lint rule
const LOGO_BAR_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const LOGO_BARS = [35, 70, 50, 90, 60, 100, 45].map((pct, i) => ({
  id: `logo-${LOGO_BAR_IDS[i]}`,
  pct,
  animIndex: i,
}));

const makeBarConfigs = (heights: number[], prefix: string): BarConfig[] =>
  heights.map((height, i) => ({
    id: `${prefix}-${String.fromCharCode(97 + (i % 26))}${i >= 26 ? String(Math.floor(i / 26)) : ''}`,
    height,
    sizeIndex: i,
  }));

const BAR_HEIGHTS: Record<BarSize, BarConfig[]> = {
  sm: makeBarConfigs([4, 8, 6, 10, 7, 12, 5, 9, 11, 6, 8, 4], 'sm'),
  md: makeBarConfigs([8, 16, 12, 20, 14, 24, 10, 18, 22, 12, 16, 8], 'md'),
  lg: makeBarConfigs([12, 24, 18, 30, 21, 36, 15, 27, 33, 18, 24, 12], 'lg'),
  hero: makeBarConfigs(
    [
      20, 50, 35, 70, 45, 90, 30, 65, 80, 40, 55, 25, 75, 50, 60, 35, 85, 45, 30, 70, 55, 40, 65,
      50,
    ],
    'hero',
  ),
};

export default function Waveform({
  className = '',
  barColor = 'var(--accent-bright)',
  animated = true,
  size = 'md',
}: WaveformProps) {
  // Logo mode: fills parent container using relative sizing
  if (size === 'logo') {
    return (
      <div
        className={`flex items-end justify-around w-full h-full ${className}`}
        aria-hidden="true"
      >
        {LOGO_BARS.map((bar) => (
          <motion.div
            key={bar.id}
            className="flex-1 rounded-full mx-[3%]"
            style={{
              backgroundColor: barColor,
              height: `${bar.pct}%`,
              opacity: 0.9,
              transformOrigin: 'bottom center',
            }}
            animate={
              animated
                ? {
                    scaleY: [
                      1,
                      0.3 + (bar.animIndex % 3) * 0.2,
                      0.8,
                      0.2 + (bar.animIndex % 4) * 0.2,
                      1,
                    ],
                    opacity: [0.9, 0.5, 1, 0.6, 0.9],
                  }
                : undefined
            }
            transition={
              animated
                ? {
                    duration: 1.2 + (bar.animIndex % 5) * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: bar.animIndex * 0.08,
                  }
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  // At this point size is BarSize | undefined; default to 'md'
  const bars = BAR_HEIGHTS[size ?? 'md'];

  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="rounded-full flex-shrink-0"
          style={{
            width: size === 'hero' ? '3px' : '2px',
            backgroundColor: barColor,
            height: bar.height,
            opacity: 0.7,
          }}
          animate={
            animated
              ? {
                  scaleY: BAR_SCALE_VALUES[bar.sizeIndex % BAR_SCALE_VALUES.length],
                  opacity: [0.7, 0.4, 0.9, 0.5, 0.7],
                }
              : undefined
          }
          transition={
            animated
              ? {
                  duration: 1.2 + (bar.sizeIndex % 5) * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: bar.sizeIndex * 0.05,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
