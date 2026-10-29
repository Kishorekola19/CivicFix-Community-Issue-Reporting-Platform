import React from "react";

export default function Coordinator() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            CIVICFIX / COORDINATOR
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Coordinator Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Review community reports, coordinate work,
            and track issue resolution progress.
          </p>
        </header>
      </div>
    </main>
  );
}