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

    // 3. Format data for leaflet.heat: [lat, lng, intensity]
    const heatData = points.map(p => [p[0], p[1], 0.6]);

    // 4. Paint the glowing layer
    const heatLayer = L.heatLayer(heatData, {
      radius: 22,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: '#06b6d4', // Cyan
        0.7: '#22d3ee', // Bright Cyan
        1.0: '#fb7185'  // Pink for overlaps
      }
    }).addTo(map);

    // 5. Cleanup when data changes
    return () => map.removeLayer(heatLayer);
  }, [map, points]);

  return null;
}