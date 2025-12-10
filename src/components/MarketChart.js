"use client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const MarketChart = ({ marketHistory }) => {
  if (!marketHistory || marketHistory.length === 0) {
    return (
      <div className="border border-gray-800 bg-gray-900/40 rounded p-4 h-full flex items-center justify-center">
        <div className="text-gray-600 text-xs">No market data yet...</div>
      </div>
    );
  }

  // Format data for chart (show last 60 days or all if less)
  const chartData = marketHistory.slice(-60).map((point) => {
    // Format date for display (e.g., "01 Jan" or "15 Dec")
    const dateObj = new Date(point.date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const dateLabel = `${day} ${month}`;
    
    return {
      date: point.date,
      dateLabel: dateLabel,
      index: parseFloat(point.index.toFixed(2))
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.index - 100;
      const changePct = ((data.index / 100 - 1) * 100).toFixed(2);
      return (
        <div className="bg-black border border-amber-800 p-2 text-xs font-mono">
          <div className="text-gray-400">{data.date}</div>
          <div className="text-amber-500">Index: {data.index.toFixed(2)}</div>
          <div className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
            {change >= 0 ? '+' : ''}{changePct}%
          </div>
        </div>
      );
    }
    return null;
  };

  const currentIndex = chartData.length > 0 ? chartData[chartData.length - 1].index : 100;
  const change = currentIndex - 100;
  const changePct = ((currentIndex / 100 - 1) * 100).toFixed(2);

  return (
    <div className="border border-gray-800 bg-gray-900/40 rounded flex flex-col h-full overflow-hidden" data-tutorial="market-chart">
      <div className="border-b border-gray-800 p-2 flex justify-between items-center shrink-0">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Market Index</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">{currentIndex.toFixed(2)}</div>
          <div className={`text-xs font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{changePct}%
          </div>
        </div>
      </div>
      <div className="flex-grow p-2 min-h-0 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
            <Line 
              type="monotone" 
              dataKey="index" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <XAxis 
              dataKey="dateLabel" 
              hide={true}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              domain={['auto', 'auto']}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketChart;

