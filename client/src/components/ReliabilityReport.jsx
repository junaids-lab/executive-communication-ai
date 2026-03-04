import React from "react";

function getRiskColor(score) {
  if (score <= 30) return { ring: "text-emerald-400", bg: "bg-emerald-400", label: "Low Risk" };
  if (score <= 60) return { ring: "text-amber-400", bg: "bg-amber-400", label: "Moderate Risk" };
  return { ring: "text-red-400", bg: "bg-red-400", label: "High Risk" };
}

export default function ReliabilityReport({ report }) {
  const risk = getRiskColor(report.risk_score);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Reliability Report
        </h3>
        {report.was_refined && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            v{report.version} Refined
          </span>
        )}
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-800"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${(report.risk_score / 100) * 264} 264`}
              strokeLinecap="round"
              className={risk.ring}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {report.risk_score}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
        <p className={`mt-2 text-sm font-medium ${risk.ring}`}>{risk.label}</p>
        <p className="text-xs text-slate-500 mt-1">Risk of Misinterpretation</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Tone Alignment
          </p>
          <p className="text-sm text-slate-300">{report.tone_alignment}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Analysis
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            {report.reasoning}
          </p>
        </div>

        {report.suggestions && report.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Suggestions
            </p>
            <ul className="space-y-1">
              {report.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-400 flex items-start gap-2"
                >
                  <span className="text-slate-600 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
