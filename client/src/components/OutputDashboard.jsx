import React, { useState } from "react";
import ReliabilityReport from "./ReliabilityReport.jsx";

const TABS = [
  { key: "email", label: "Email" },
  { key: "summary", label: "Summary" },
  { key: "slack", label: "Slack" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function OutputDashboard({ result }) {
  const [activeTab, setActiveTab] = useState("email");

  const content = {
    email: result.email,
    summary: result.summary,
    slack: result.slack_message,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex border-b border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            <div className="flex justify-end mb-3">
              <CopyButton text={content[activeTab]} />
            </div>
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-950/50 rounded-xl p-4 border border-slate-800 min-h-[200px]">
              {content[activeTab]}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <ReliabilityReport report={result.reliability_report} />
      </div>
    </div>
  );
}
