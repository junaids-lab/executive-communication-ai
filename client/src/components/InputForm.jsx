import React, { useState } from "react";

const TONES = [
  { value: "firm", label: "Firm", desc: "Direct, assertive, clear boundaries" },
  {
    value: "executive",
    label: "Executive",
    desc: "Strategic, concise, C-suite ready",
  },
  {
    value: "empathetic",
    label: "Empathetic",
    desc: "Supportive, warm, understanding",
  },
  {
    value: "amazon_lp",
    label: "Amazon Leadership Principles",
    desc: "Ownership, Bias for Action, Earn Trust",
  },
];

export default function InputForm({ onSubmit, onStop, loading }) {
  const [bulletPoints, setBulletPoints] = useState("");
  const [tone, setTone] = useState("executive");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bulletPoints.trim()) return;
    onSubmit(bulletPoints, tone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Rough Bullet Points
        </label>
        <textarea
          value={bulletPoints}
          onChange={(e) => setBulletPoints(e.target.value)}
          placeholder={`- Need to push back on timeline\n- Budget is 20% over\n- Team needs more resources\n- Deadline is non-negotiable from client side`}
          rows={6}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm leading-relaxed"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={loading}
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.desc}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all text-sm whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!bulletPoints.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              Refine Communication
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
