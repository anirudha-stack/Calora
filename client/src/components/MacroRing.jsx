import { PieChart, Pie, Cell } from 'recharts';

const MACROS = [
  { key: 'protein_g', color: '#60A5FA', factor: 4 },
  { key: 'carbohydrates_g', color: '#FBBF24', factor: 4 },
  { key: 'fat_g', color: '#F87171', factor: 9 },
];

export default function MacroRing({ nutrition, size = 140 }) {
  const n = nutrition || {};

  const data = MACROS
    .map(m => ({ ...m, value: (n[m.key] || 0) * m.factor }))
    .filter(d => d.value > 0);

  if (data.length === 0) {
    data.push({ value: 1, color: 'rgba(255,255,255,0.05)' });
  }

  const calories = Math.round(n.calories || 0);
  const cx = size / 2;
  const innerR = size * 0.33;
  const outerR = size * 0.46;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={cx} cy={cx}
          innerRadius={innerR} outerRadius={outerR}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white leading-none">{calories.toLocaleString()}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">kcal</span>
      </div>
    </div>
  );
}
