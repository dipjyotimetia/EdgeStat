export const CHART_COLORS = {
  grid: '#1E4D44',
  axis: '#1E4D44',
  tick: '#1E6B5A',
  area: '#00D4AA',
  areaGlow: '#00FFD1',
  bar: '#00D4AA',
  tooltipBg: '#0A2540',
  tooltipBorder: '#1E4D44',
  tooltipLabel: '#7FFFD4',
  tooltipItem: '#E2F9F5',
} as const;

export const AXIS_TICK_STYLE = {
  fill: CHART_COLORS.tick,
  fontSize: 11,
  fontFamily: 'monospace',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  labelStyle: { color: CHART_COLORS.tooltipLabel },
  itemStyle: { color: CHART_COLORS.tooltipItem },
} as const;

export const ANIMATION_PROPS = {
  isAnimationActive: 'auto' as const,
  animationDuration: 300,
  animationEasing: 'ease-out' as const,
};

export const formatBucket = (v: string): string => v.slice(5);

export interface ChartDataPoint {
  bucket: string;
  visitors: number;
  pageviews: number;
}
