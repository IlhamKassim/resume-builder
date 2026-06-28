"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ProfileData } from "@/lib/types";

interface Props {
  onProfile: (profile: ProfileData) => void;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; name: string }
  | { status: "error"; message: string };

export function ProfileInput({ onProfile }: Props) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchProfile() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error });
        setShowUpload(true);
        return;
      }
      onProfile(data as ProfileData);
      setState({ status: "done", name: (data as ProfileData).name });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
      setShowUpload(true);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setState({ status: "loading" });
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/profile/csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error });
        return;
      }
      onProfile(data as ProfileData);
      setState({ status: "done", name: (data as ProfileData).name });
    } catch {
      setState({ status: "error", message: "Failed to parse CSV. Please try again." });
    }
  }

  if (state.status === "done") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-800">Profile loaded</p>
          <p className="text-sm text-green-600">{state.name}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setState({ status: "idle" });
            setShowUpload(false);
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Profile URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url && fetchProfile()}
            placeholder="https://linkedin.com/in/yourname"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <Button
            onClick={fetchProfile}
            disabled={!url || state.status === "loading"}
          >
            {state.status === "loading" ? "Loading…" : "Load Profile"}
          </Button>
        </div>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      {showUpload && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Upload LinkedIn CSV export instead
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Go to LinkedIn → Settings & Privacy → Data Privacy → Get a copy of your data.
            Select Profile, Positions, Education, Skills and upload all CSV files here.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleCsvUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={state.status === "loading"}
          >
            {state.status === "loading" ? "Parsing…" : "Choose CSV files"}
          </Button>
        </div>
      )}

      {!showUpload && (
        <button
          className="text-xs text-gray-400 underline underline-offset-2"
          onClick={() => setShowUpload(true)}
        >
          LinkedIn blocked? Upload CSV export instead
        </button>
      )}
    </div>
  );
}
