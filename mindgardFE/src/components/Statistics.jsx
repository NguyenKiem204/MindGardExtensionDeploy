import { useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { showStreakCelebration } from "../utils/celebrations";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Statistics({ totals, streak }) {
  const data = (totals || []).map((v, i) => ({ name: LABELS[i], minutes: v }));

  // Show streak celebration when streak changes
  useEffect(() => {
    if (streak > 0) {
      showStreakCelebration(streak);
    }
  }, [streak]);
  const bestIdx = (totals || []).reduce(
    (bi, v, i, arr) => (v > arr[bi] ? i : bi),
    0
  );
  const message =
    streak >= 5
      ? `Bạn đã duy trì chuỗi ${streak} ngày liên tiếp!`
      : `Ngày hiệu quả nhất của bạn là ${LABELS[bestIdx]}.`;
  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
      <div className="font-semibold mb-2">Statistics</div>
      <div className="text-sm opacity-90 mb-3">{message}</div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.8)",
                border: "none",
                color: "#fff",
              }}
            />
            <Bar dataKey="minutes" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
