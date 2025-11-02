import { useState, useEffect } from 'react';
import { evacuationService } from '../services/evacuationService';
import RouteMap from './RouteMap';

export default function EvacuationRoutes() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hazardInfo, setHazardInfo] = useState({
    needsMedical: false,
    needsPets: false,
    specialNeeds: false
  });

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const currentLocation = await evacuationService.getCurrentLocation();
      setLocation(currentLocation);
      await fetchRoutes(currentLocation);
    } catch (err) {
      setError('Unable to get your location. Please enter address manually.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError('');
    try {
      const geocoded = await evacuationService.geocodeAddress(address);
      setLocation(geocoded);
      await fetchRoutes(geocoded);
    } catch (err) {
      setError('Unable to find address. Please check and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async (origin) => {
    try {
      const evacuationRoutes = await evacuationService.getEvacuationRoutes(origin, hazardInfo);
      setRoutes(evacuationRoutes);
    } catch (err) {
      setError('Unable to calculate routes. Please try again.');
      console.error(err);
    }
  };

  const refreshRoutes = () => {
    if (location) {
      fetchRoutes(location);
    }
  };

  useEffect(() => {
    if (location) {
      refreshRoutes();
    }
  }, [hazardInfo]);

  return (
    <div className="space-y-6">
      {/* Location Input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-3xl">🗺️</span> Find Evacuation Routes
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use My Location
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or enter address</span>
            </div>
          </div>

          <form onSubmit={handleAddressSubmit} className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address or ZIP code"
              className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none dark:bg-slate-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              Search
            </button>
          </form>

          {/* Hazard Options */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Special Requirements:</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazardInfo.needsMedical}
                  onChange={(e) => setHazardInfo({...hazardInfo, needsMedical: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm">Medical needs</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazardInfo.needsPets}
                  onChange={(e) => setHazardInfo({...hazardInfo, needsPets: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm">Pets</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazardInfo.specialNeeds}
                  onChange={(e) => setHazardInfo({...hazardInfo, specialNeeds: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm">Special needs</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-300">Calculating routes...</span>
          </div>
        )}
      </div>

      {/* Routes Display */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Recommended Evacuation Routes</h3>
            <button
              onClick={refreshRoutes}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {routes.map((routeData, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                      index === 0 ? 'bg-emerald-600' : index === 1 ? 'bg-blue-600' : 'bg-purple-600'
                    }`}>
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {routeData.destination.name}
                    </h4>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{routeData.destination.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {routeData.summary.durationMinutes} min
                  </div>
                  <div className="text-sm text-slate-500">{routeData.summary.distanceMiles} miles</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Capacity</div>
                  <div className="font-semibold">{routeData.destination.capacity}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Type</div>
                  <div className="font-semibold text-sm capitalize">{routeData.destination.type.replace('_', ' ')}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Distance</div>
                  <div className="font-semibold">{routeData.summary.distanceKm} km</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Traffic</div>
                  <div className="font-semibold">
                    {routeData.summary.trafficDelay > 0 
                      ? `+${Math.round(routeData.summary.trafficDelay / 60)} min` 
                      : 'Clear'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Facilities:</div>
                <div className="flex flex-wrap gap-2">
                  {routeData.destination.facilities.map((facility) => (
                    <span
                      key={facility}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded capitalize"
                    >
                      {facility.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {routeData.destination.description}
              </p>

              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedRoute(routeData)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Start Navigation
                </button>
                <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Share
                </button>
              </div>

              {routeData.fallback && (
                <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Estimated time based on distance (live traffic unavailable)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Route Map Modal */}
      {selectedRoute && location && (
        <RouteMap
          route={selectedRoute.route}
          origin={location}
          destination={selectedRoute.destination}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
  );
}
