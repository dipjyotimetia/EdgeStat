import { useId } from 'react';
import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CHART_COLORS,
  AXIS_TICK_STYLE,
  TOOLTIP_STYLE,
  ANIMATION_PROPS,
  formatBucket,
  type ChartDataPoint,
} from './chartTheme';

interface AreaChartProps {
  data: ChartDataPoint[];
  dataKey?: 'visitors' | 'pageviews';
}

export function AreaChart({ data, dataKey = 'visitors' }: AreaChartProps) {
  const gradientId = useId();

  return (
    <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-5">
      <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider mb-4">
        Traffic Over Time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        {/* v3: accessibilityLayer enables keyboard nav (default true, explicit for clarity) */}
        <ReAreaChart<ChartDataPoint>
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.area} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.area} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            strokeOpacity={0.3}
            xAxisId={0}
            yAxisId={0}
          />
          <XAxis
            xAxisId={0}
            dataKey="bucket"
            tick={AXIS_TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.axis }}
            tickFormatter={formatBucket}
          />
          <YAxis
            yAxisId={0}
            tick={AXIS_TICK_STYLE}
            tickLine={false}
            axisLine={false}
            width="auto"
          />
          {/* v3: animationDuration respects prefers-reduced-motion via 'auto' */}
          <Tooltip
            {...TOOLTIP_STYLE}
            animationDuration={ANIMATION_PROPS.animationDuration}
          />
          <Area<ChartDataPoint>
            type="monotone"
            dataKey={dataKey}
            xAxisId={0}
            yAxisId={0}
            stroke={CHART_COLORS.area}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            {...ANIMATION_PROPS}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
