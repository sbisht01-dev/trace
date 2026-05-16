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

// Auto-pans the map when actively walking
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

// Auto-frames the map around your past walks
function CenterOnHeatmap({ points, isTracking }) {
  const map = useMap();
  
  useEffect(() => {
    if (isTracking || !points || points.length === 0) return;

    try {
      // Filter for valid objects and map to Leaflet-friendly arrays
      const validPoints = points
        .filter(p => p && p.lat !== undefined && p.lng !== undefined)
        .map(p => [p.lat, p.lng]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
      }
    } catch (e) {
      console.error("Bounding box error:", e);
    }
  }, [points, map, isTracking]);

  return null;
}

const calculateDistance = (path) => {
  if (path.length < 2) return 0;
  let total = 0;
  const R = 6371; 
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    // Use .lat and .lng instead of indices
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat*Math.PI/180) * Math.cos(p2.lat*Math.PI/180) * Math.sin(dLon/2)**2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  return total;
};

export default function MainMap({ isTracking, onUpdateDistance, onWalkFinish }) {
  const [path, setPath] = useState([]); // Stores {lat, lng, timestamp}
  const [history, setHistory] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);

  useEffect(() => {
    fixLeafletIcons();
    const savedHistory = localStorage.getItem("walkHistory");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Clean history: Ensure we only keep objects, not old arrays
        const cleaned = parsed.filter(p => p && typeof p === 'object' && !Array.isArray(p));
        setHistory(cleaned);
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 100) return; 

        // CREATE OBJECT FORMAT
        const newPoint = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now()
        };

        setCurrentPos([latitude, longitude]);
        setError(null);
        
        if (isTracking) {
          setPath((prev) => {
            const lastPoint = prev[prev.length - 1];
            // Update duplicate check for objects
            if (lastPoint && lastPoint.lat === newPoint.lat && lastPoint.lng === newPoint.lng) return prev;
            
            const newPath = [...prev, newPoint];
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

  const allPoints = useMemo(() => [...history, ...path], [history, path]);

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
        
        {/* MAP TO ARRAYS ONLY FOR THE RENDERERS */}
        <HeatmapLayer points={allPoints.map(p => [p.lat, p.lng])} />
        
        <CenterOnHeatmap points={history} isTracking={isTracking} />

        <Polyline 
          positions={path.map(p => [p.lat, p.lng])} 
          pathOptions={{ 
            color: "#fde047", 
            weight: 2,        
            opacity: 0.6,     
            lineJoin: 'round' 
          }} 
        />

        {currentPos && (
          <>
            <CircleMarker center={currentPos} radius={8} pathOptions={{ fillColor: "#fde047", fillOpacity: 1, color: "white", weight: 2 }} />
            <RecenterMap position={currentPos} />
          </>
        )}
      </MapContainer>
    </div>
  );
}