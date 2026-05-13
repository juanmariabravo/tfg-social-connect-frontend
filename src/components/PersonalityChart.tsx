import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";

const COLORS = ["#FF6B6B", "#FF8E8E", "#A855F7", "#4ECDC4", "#F59E0B", "#EC4899", "#8B5CF6"];

export function PersonalityChart({ data }: { data: { trait: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="trait" tick={{ fontSize: 12, fill: "#6B7280" }} width={110} axisLine={false} tickLine={false} />
          <Bar dataKey="value" radius={8}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
