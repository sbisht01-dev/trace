"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import HeatmapLayer from "./HeatmapLayer";

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
      hasCentered.current = true;
    }
  }, [position, map]);
  return null;
}

const calculateDistance = (path) => {
  if (path.length < 2) return 0;
  let total = 0;
  const R = 6371; // Earth's radius in km
  for (let i = 0; i < path.length - 1; i++) {
    const [lat1, lon1] = path[i];
    const [lat2, lon2] = path[i+1];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  return total;
};

export default function MainMap({ isTracking, onUpdateDistance, onWalkFinish }) {
  const [path, setPath] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);

  // Load past walks on mount
  useEffect(() => {
    fixLeafletIcons();
    const savedHistory = localStorage.getItem("walkHistory");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save to history when tracking stops
  const prevTrackingRef = useRef(isTracking);
  useEffect(() => {
    if (prevTrackingRef.current && !isTracking && path.length > 0) {
      const newHistory = [...history, ...path];
      setHistory(newHistory);
      localStorage.setItem("walkHistory", JSON.stringify(newHistory));
      setPath([]); 
      onWalkFinish(); 
    }
    prevTrackingRef.current = isTracking;
  }, [isTracking, path, history, onWalkFinish]);

  // GPS Engine
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 100) return; // Ignore bad signals

        const newPos = [latitude, longitude];
        setCurrentPos(newPos);
        setError(null);
        
        if (isTracking) {
          setPath((prev) => {
            const lastPoint = prev[prev.length - 1];
            if (lastPoint && lastPoint[0] === newPos[0] && lastPoint[1] === newPos[1]) return prev;
            
            const newPath = [...prev, newPos];
            onUpdateDistance(calculateDistance(newPath));
            return newPath;
          });
        }
      },
      (err) => setError(err.code === 1 ? "PERMISSION_DENIED" : "POSITION_UNAVAILABLE"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      if (watcherRef.current) navigator.geolocation.clearWatch(watcherRef.current);
    };
  }, [isTracking, onUpdateDistance]);

  const allHeatmapPoints = useMemo(() => [...history, ...path], [history, path]);

  return (
    <div className="relative h-full w-full bg-slate-950 z-0">
      {error === "PERMISSION_DENIED" && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center">
          <p className="text-white font-bold mb-4">Location Access Required</p>
          <button onClick={() => window.location.reload()} className="bg-cyan-500 text-slate-950 px-6 py-2 rounded-full font-bold">RELOAD PAGE</button>
        </div>
      )}

      <MapContainer center={[20.5937, 78.9629]} zoom={5} zoomControl={false} className="h-full w-full">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <HeatmapLayer points={allHeatmapPoints} />
        <Polyline positions={path} pathOptions={{ color: "#22d3ee", weight: 6, lineJoin: 'round' }} />

        {currentPos && (
          <>
            <CircleMarker center={currentPos} radius={8} pathOptions={{ fillColor: "#22d3ee", fillOpacity: 1, color: "white", weight: 2 }} />
            <RecenterMap position={currentPos} />
          </>
        )}
      </MapContainer>
    </div>
  );
}