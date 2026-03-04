import React, { useState, useEffect, useRef } from "react";
import InputForm from "./components/InputForm.jsx";
import OutputDashboard from "./components/OutputDashboard.jsx";
import PipelineLog from "./components/PipelineLog.jsx";
import ApiKeySettings from "./components/ApiKeySettings.jsx";

function generateSessionId() {
  const stored = sessionStorage.getItem("exec_ai_session_id");
  if (stored) return stored;
  const id = crypto.randomUUID().replace(/-/g, "");
  sessionStorage.setItem("exec_ai_session_id", id);
  return id;
}

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => generateSessionId());
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetch(`/api/keys/status/${sessionId}`)
      .then((r) => r.json())
      .then((d) => setHasCustomKey(d.using_custom_key))
      .catch(() => {});
  }, [sessionId]);

  const handleSubmit = async (bulletPoints, tone) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet_points: bulletPoints,
          tone,
          session_id: hasCustomKey ? sessionId : null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg">
            E
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Executive Communication AI
            </h1>
            <p className="text-sm text-slate-400">
              Multi-step reliability pipeline for professional messaging
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <ApiKeySettings
          sessionId={sessionId}
          hasCustomKey={hasCustomKey}
          onKeyChange={setHasCustomKey}
        />

        <InputForm onSubmit={handleSubmit} onStop={handleStop} loading={loading} />

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">
                Running Reliability Pipeline
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Classifying → Drafting → Critiquing → Refining
              </p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-8">
            <OutputDashboard result={result} />
            <PipelineLog log={result.pipeline_log} />
          </div>
        )}
      </main>
    </div>
  );
}
