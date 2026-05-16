"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// IMPORTANT: We use dynamic import with ssr: false 
// This prevents the "window is not defined" error during Next.js builds.
const MainMap = dynamic(() => import("@/components/MainMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Initializing Trace Engine...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [isTracking, setIsTracking] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      
      {/* 1. THE MAP BASELAYER */}
      <div className="absolute inset-0 z-0">
        <MainMap isTracking={isTracking} />
      </div>

      {/* 2. OVERLAY: HEADER */}
      <div className="absolute top-6 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl pointer-events-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white font-black text-xl tracking-tighter italic">TRACE</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Personal Heatmap v1.0</p>
            </div>
            {isTracking && (
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-500 text-[10px] font-black uppercase">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. OVERLAY: BOTTOM CONTROLS */}
      <div className="absolute bottom-10 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex flex-col gap-4 pointer-events-auto">
          
          {/* Stats Bar (Mockup for now, we'll add logic in Phase 2/3) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 backdrop-blur-lg border border-white/5 p-3 rounded-2xl shadow-xl">
             <div className="text-center">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Distance</p>
                <p className="text-white font-mono font-bold">0.00 km</p>
             </div>
             <div className="text-center border-l border-white/10">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Duration</p>
                <p className="text-white font-mono font-bold">00:00:00</p>
             </div>
          </div>

          {/* Main Action Button */}
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`w-full py-5 rounded-[2rem] font-black text-lg tracking-widest transition-all duration-300 active:scale-95 shadow-2xl ${
              isTracking 
              ? 'bg-rose-600 text-white shadow-rose-900/40 border-t border-white/20' 
              : 'bg-cyan-500 text-slate-950 shadow-cyan-900/40'
            }`}
          >
            {isTracking ? "STOP RECORDING" : "START NEW WALK"}
          </button>
        </div>
      </div>

      {/* Subtle vignette effect to make the map look more premium */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] z-0" />
    </main>
  );
}