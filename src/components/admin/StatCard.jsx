import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";

export default function StatCard({ title, value, data, icon, color, grow }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 強制延遲 300ms，等待 Tailwind/React 完成佈局計算
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white p-6 rounded-[30px] border border-gray-50 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg uppercase">
          {grow}
        </span>
      </div>

      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-black italic tracking-tighter">{value}</h3>
      </div>

      {/* 💡 核心修正點：給定高度並加入 debounce */}
      <div className="h-16 w-full mt-4" style={{ minWidth: 0, minHeight: 0 }}>
        {isReady && data && data.length > 0 && (
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={data}>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="currentColor"
                fill="currentColor"
                fillOpacity={0.2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
