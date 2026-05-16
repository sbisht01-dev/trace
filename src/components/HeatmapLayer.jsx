"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet"; // Import Leaflet first

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    // 1. Safety check: Only run if map exists, points exist, and we are in the browser
    if (!map || !points || points.length === 0 || typeof window === "undefined") return;

    // 2. Dynamically inject the heatmap plugin ONLY on the client side
    require("leaflet.heat");
    const heatData = points
      .filter(p => p && p[0] !== undefined && p[1] !== undefined)
      .map(p => [p[0], p[1], 0.6]);
    if (heatData.length === 0) return;


    // 4. Paint the glowing layer
    const heatLayer = L.heatLayer(heatData, {
      radius: 12, // Decreased from 22 for a much thinner line
      blur: 10,   // Decreased from 15 to keep the edges sharp
      maxZoom: 17,
      gradient: {
        0.3: '#fde047', // Yellow (1 pass)
        0.5: '#f59e0b', // Amber (2 passes)
        0.7: '#ea580c', // Orange (3 passes)
        1.0: '#e11d48'  // Red/Crimson (4+ passes - High Frequency)
      }
    }).addTo(map);

    // 5. Cleanup when data changes
    return () => map.removeLayer(heatLayer);
  }, [map, points]);

  return null;
}