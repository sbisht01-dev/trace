import Link from "next/link";

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans">
      
      {/* Background Glowing Orb Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 text-center px-6 w-full max-w-md">
        
        {/* Logo & Subtitle */}
        <div className="mb-16">
          <h1 className="text-white font-black text-6xl md:text-8xl italic tracking-tighter mb-2">TRACE</h1>
          <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-bold">
            Your Personal Heatmap
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          
          {/* Button bridging to the Map Page */}
          <Link 
            href="/map"
            className="w-full block bg-cyan-500 text-slate-950 font-black text-lg tracking-widest py-5 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            ENTER APP
          </Link>

          {/* Disabled Placeholder for Future Auth */}
          <button 
            disabled
            className="w-full flex items-center justify-center gap-3 bg-slate-900/50 text-slate-500 font-bold text-sm tracking-widest py-4 rounded-[2rem] border border-slate-800 cursor-not-allowed"
          >
            {/* Simple Google G SVG Icon */}
            <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            GOOGLE LOGIN (SOON)
          </button>

        </div>
      </div>
    </main>
  );
}