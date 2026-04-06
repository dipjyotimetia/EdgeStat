import {
  BarChart as ReBarChart,
  Bar,
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

interface BarChartProps {
  data: ChartDataPoint[];
  dataKey?: 'visitors' | 'pageviews';
}

export function BarChart({ data, dataKey = 'pageviews' }: BarChartProps) {
  return (
    <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-5">
      <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider mb-4">
        {dataKey === 'pageviews' ? 'Pageviews' : 'Visitors'} Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <ReBarChart<ChartDataPoint>
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          accessibilityLayer
        >
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
          <Tooltip {...TOOLTIP_STYLE} animationDuration={ANIMATION_PROPS.animationDuration} />
          <Bar<ChartDataPoint>
            dataKey={dataKey}
            xAxisId={0}
            yAxisId={0}
            fill={CHART_COLORS.bar}
            radius={[4, 4, 0, 0]}
            {...ANIMATION_PROPS}
          />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
