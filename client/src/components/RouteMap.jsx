import { useEffect, useRef, useState } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

export default function RouteMap({ route, origin, destination, onClose }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapElement.current || !TOMTOM_API_KEY) return;

    // Initialize map
    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: mapElement.current,
      center: [origin.lng, origin.lat],
      zoom: 11
    });

    mapInstance.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      // Add markers for origin and destination
      new tt.Marker({ color: '#4F46E5' })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(new tt.Popup({ offset: 30 }).setHTML('<div class="p-2"><strong>Your Location</strong></div>'))
        .addTo(map);

      new tt.Marker({ color: '#10B981' })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(new tt.Popup({ offset: 30 }).setHTML(`<div class="p-2"><strong>${destination.name}</strong><br/>${destination.address}</div>`))
        .addTo(map);

      // Draw route if available
      if (route && route.legs && route.legs[0] && route.legs[0].points) {
        const coordinates = route.legs[0].points.map(point => [point.longitude, point.latitude]);

        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            }
          },
          paint: {
            'line-color': '#4F46E5',
            'line-width': 6,
            'line-opacity': 0.8
          }
        });

        // Fit map to show entire route
        const bounds = new tt.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });
      } else {
        // If no route data, fit bounds to show origin and destination
        const bounds = new tt.LngLatBounds();
        bounds.extend([origin.lng, origin.lat]);
        bounds.extend([destination.lng, destination.lat]);
        map.fitBounds(bounds, { padding: 100 });
      }
    });

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [route, origin, destination]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Route to {destination.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {destination.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
          <div ref={mapElement} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-300">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Route Info Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {route?.summary?.durationMinutes || Math.round((destination.distance || 0) * 2)} min
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Travel Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {route?.summary?.distanceMiles || ((destination.distance || 0) * 0.621371).toFixed(1)} mi
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {destination.capacity}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {route?.summary?.trafficDelay > 0 
                  ? `+${Math.round(route.summary.trafficDelay / 60)}` 
                  : '0'} min
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Traffic Delay</div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-center"
            >
              Open in Google Maps
            </a>
            <a
              href={`https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition font-semibold text-center"
            >
              Open in Apple Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
