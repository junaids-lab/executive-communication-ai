import React, { useState } from "react";

export default function PipelineLog({ log }) {
  const [expanded, setExpanded] = useState(false);

  const getLogColor = (line) => {
    if (line.includes("[Step 1]")) return "text-cyan-400";
    if (line.includes("[Step 2]")) return "text-violet-400";
    if (line.includes("[Step 3]")) return "text-amber-400";
    if (line.includes("[Step 4]")) return "text-emerald-400";
    if (line.includes("Pipeline")) return "text-blue-400";
    return "text-slate-400";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Pipeline Inner Monologue
          </h3>
          <span className="text-xs text-slate-500">
            {log.length} steps logged
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-5 border-t border-slate-800">
          <div className="mt-4 bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {log.map((line, i) => (
              <div key={i} className={`flex gap-3 ${getLogColor(line)}`}>
                <span className="text-slate-600 select-none w-6 text-right shrink-0">
                  {i + 1}
                </span>
                <span className="break-words">{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
