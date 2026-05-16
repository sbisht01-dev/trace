"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const MainMap = dynamic(() => import("@/components/MainMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Initializing Trace Engine...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState({ distance: 0, time: 0 });
  const timerRef = useRef(null);

  // Timer Logic
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setStats((prev) => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  // Format time (00:00:00)
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset stats when walk is finished and saved
  const handleWalkFinish = useCallback(() => {
    setStats({ distance: 0, time: 0 });
  }, []);

  // ==========================================
  // TEMPORARY DEVELOPER TOOLS
  // ==========================================
 const injectTestData = () => {
    const centerLat = 28.6139; 
    const centerLng = 77.2090;
    
    // 1. We MUST define the mockSession object first!
    const mockSession = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      duration: 1200, // 20 minutes
      distance: 3.45,
      path: [] 
    };

    // 2. Now we fill that session's path with coordinate objects
    for (let i = 0; i < 150; i++) {
      const angle = (i / 150) * Math.PI * 2;
      mockSession.path.push({
        lat: centerLat + Math.cos(angle) * 0.005,
        lng: centerLng + Math.sin(angle) * 0.005,
        timestamp: Date.now() + (i * 1000)
      });
    }

    // 3. Get existing history, add the new session, and save
    const existingHistory = JSON.parse(localStorage.getItem("walkHistory") || "[]");
    
    // We save it as an array of objects
    localStorage.setItem("walkHistory", JSON.stringify([...existingHistory, ...mockSession.path]));
    
    window.location.reload();
  };
  const clearTestData = () => {
    localStorage.removeItem("walkHistory");
    window.location.reload();
  };
  // ==========================================

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MainMap
          isTracking={isTracking}
          onUpdateDistance={(d) => setStats(s => ({ ...s, distance: d }))}
          onWalkFinish={handleWalkFinish}
        />
      </div>

      {/* Top Header */}
      <div className="absolute top-6 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl pointer-events-auto flex flex-col gap-3">

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white font-black text-xl italic tracking-tighter">TRACE</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Heatmap v1.0</p>
            </div>
            {isTracking && (
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-500 text-[10px] font-black uppercase">Live</span>
              </div>
            )}
          </div>

          {/* TEMPORARY DEV BUTTONS */}
          <div className="flex gap-2 border-t border-white/10 pt-3 mt-1">
            <button onClick={injectTestData} className="flex-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold py-2 rounded-lg border border-purple-500/30 active:scale-95 transition-all hover:bg-purple-500/30">
              INJECT MOCK DATA
            </button>
            <button onClick={clearTestData} className="flex-1 bg-slate-800 text-slate-400 text-[10px] font-bold py-2 rounded-lg border border-slate-700 active:scale-95 transition-all hover:bg-slate-700">
              CLEAR STORAGE
            </button>
          </div>

        </div>
      </div>

      {/* Stats & Controls */}
      <div className="absolute bottom-10 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex flex-col gap-4 pointer-events-auto">

          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 backdrop-blur-lg border border-white/5 p-4 rounded-3xl shadow-xl">
            <div className="text-center">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Distance</p>
              <p className="text-white text-2xl font-black">{stats.distance.toFixed(2)} <span className="text-xs text-cyan-500 font-normal">KM</span></p>
            </div>
            <div className="text-center border-l border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Duration</p>
              <p className="text-white text-2xl font-black font-mono">{formatTime(stats.time)}</p>
            </div>
          </div>

          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`w-full py-5 rounded-[2rem] font-black text-lg tracking-widest transition-all duration-300 active:scale-95 shadow-2xl ${isTracking ? 'bg-rose-600 text-white border-t border-white/20 shadow-rose-900/40' : 'bg-cyan-500 text-slate-950 shadow-cyan-900/40'
              }`}
          >
            {isTracking ? "FINISH WALK" : "START TRACKING"}
          </button>
        </div>
      </div>
    </main>
  );
}