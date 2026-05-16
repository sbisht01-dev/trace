"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet's default marker icons
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

function RecenterMap({ position }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (position && !hasCentered.current) {
      map.setView(position, 17);
      hasCentered.current = true; // Only hard-center once on load
    }
  }, [position, map]);
  return null;
}

export default function MainMap({ isTracking }) {
  const [path, setPath] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);

  useEffect(() => {
    fixLeafletIcons();

    const startWatching = () => {
      if (!navigator.geolocation) {
        setError("Geolocation not supported");
        return;
      }

      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPos(newPos);
          setError(null);

          // Only add to path if tracking is explicitly ON
          if (isTracking) {
            setPath((prev) => {
              // Only add if the point has actually changed significantly
              const lastPoint = prev[prev.length - 1];
              if (lastPoint && lastPoint[0] === newPos[0] && lastPoint[1] === newPos[1]) {
                return prev;
              }
              return [...prev, newPos];
            });
          }
        },
        (err) => {
          if (err.code === 1) setError("PERMISSION_DENIED");
          else setError("POSITION_UNAVAILABLE");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    };

    startWatching();

    return () => {
      if (watcherRef.current) navigator.geolocation.clearWatch(watcherRef.current);
    };
  }, [isTracking]); // Re-run effect only when tracking status toggles

  return (
    <div className="relative h-full w-full bg-slate-950">
      {/* ERROR MODAL */}
      {error === "PERMISSION_DENIED" && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center">
          <div className="max-w-xs">
            <p className="text-white font-bold mb-4">Location Access Required</p>
            <p className="text-slate-400 text-sm mb-6">Please enable location permissions in your browser settings to see your path.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-500 text-slate-950 px-6 py-2 rounded-full font-bold text-xs"
            >
              RELOAD PAGE
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={[20.5937, 78.9629]} // Default to center of India
        zoom={currentPos ? 17 : 5}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <Polyline positions={path} pathOptions={{ color: "#22d3ee", weight: 6, lineJoin: 'round' }} />

        {currentPos && (
          <>
            <CircleMarker
              center={currentPos}
              radius={8}
              pathOptions={{ fillColor: "#22d3ee", fillOpacity: 1, color: "white", weight: 2 }}
            />
            <RecenterMap position={currentPos} />
          </>
        )}
      </MapContainer>
    </div>
  );
}