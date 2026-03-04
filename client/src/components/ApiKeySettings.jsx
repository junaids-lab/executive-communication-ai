import React, { useState } from "react";

export default function ApiKeySettings({ sessionId, hasCustomKey, onKeyChange }) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!apiKey.trim() || apiKey.length < 10) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/keys/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, api_key: apiKey.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save key");
      setApiKey("");
      onKeyChange(true);
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      await fetch(`/api/keys/${sessionId}`, { method: "DELETE" });
      onKeyChange(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        {hasCustomKey ? (
          <span className="text-emerald-400">Custom API key active</span>
        ) : (
          <span>Use your own OpenAI API key</span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <p className="text-xs text-slate-500">
            Optionally provide your own OpenAI API key. It is stored in server memory only for this session and automatically removed after 24 hours.
          </p>

          {hasCustomKey ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-emerald-400">Custom key is active</span>
              </div>
              <button
                onClick={handleRemove}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 transition-colors"
              >
                Remove key
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSave}
                disabled={saving || apiKey.length < 10}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
