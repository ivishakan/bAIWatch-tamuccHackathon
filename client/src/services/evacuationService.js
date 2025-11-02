// Corpus Christi and surrounding area safe zones / shelters
export const CORPUS_CHRISTI_SAFE_ZONES = [
  {
    id: 1,
    name: "Richard M. Borchard Regional Fairgrounds",
    address: "1213 Terry Shamsie Blvd, Robstown, TX",
    lat: 27.7908,
    lng: -97.6689,
    capacity: 2000,
    type: "major_shelter",
    facilities: ["medical", "food", "water", "pet_friendly"],
    description: "Large fairground facility with extensive shelter capacity"
  },
  {
    id: 2,
    name: "Del Mar College East Campus",
    address: "3209 S Staples St, Corpus Christi, TX",
    lat: 27.7569,
    lng: -97.3681,
    capacity: 1500,
    type: "major_shelter",
    facilities: ["medical", "food", "water"],
    description: "College campus with multiple buildings for shelter"
  },
  {
    id: 3,
    name: "American Bank Center",
    address: "1901 N Shoreline Blvd, Corpus Christi, TX",
    lat: 27.8052,
    lng: -97.3972,
    capacity: 3000,
    type: "major_shelter",
    facilities: ["medical", "food", "water", "special_needs"],
    description: "Large arena facility, main evacuation center"
  },
  {
    id: 4,
    name: "Flour Bluff High School",
    address: "2505 Waldron Rd, Corpus Christi, TX",
    lat: 27.6589,
    lng: -97.3289,
    capacity: 800,
    type: "general_shelter",
    facilities: ["food", "water"],
    description: "High school gymnasium and facilities"
  },
  {
    id: 5,
    name: "King High School",
    address: "5225 Gollihar Rd, Corpus Christi, TX",
    lat: 27.7169,
    lng: -97.4289,
    capacity: 900,
    type: "general_shelter",
    facilities: ["food", "water", "pet_friendly"],
    description: "High school with shelter facilities"
  },
  {
    id: 6,
    name: "Ray High School",
    address: "2929 Swantner Dr, Corpus Christi, TX",
    lat: 27.7919,
    lng: -97.4589,
    capacity: 850,
    type: "general_shelter",
    facilities: ["food", "water"],
    description: "High school shelter location"
  },
  {
    id: 7,
    name: "Corpus Christi Medical Center Bay Area",
    address: "7101 S Padre Island Dr, Corpus Christi, TX",
    lat: 27.6369,
    lng: -97.2869,
    capacity: 300,
    type: "medical_facility",
    facilities: ["medical", "special_needs", "dialysis", "oxygen"],
    description: "Hospital with special medical needs support"
  },
  {
    id: 8,
    name: "CHRISTUS Spohn Hospital Corpus Christi - Shoreline",
    address: "600 Elizabeth St, Corpus Christi, TX",
    lat: 27.8009,
    lng: -97.3939,
    capacity: 350,
    type: "medical_facility",
    facilities: ["medical", "special_needs", "dialysis", "oxygen"],
    description: "Main hospital facility with emergency services"
  }
];

// Hazard types that affect routing
export const HAZARD_TYPES = {
  HURRICANE: 'hurricane',
  FLOOD: 'flood',
  STORM_SURGE: 'storm_surge',
  GENERAL: 'general'
};

// Known flood-prone areas in Corpus Christi (coordinates to avoid)
export const FLOOD_ZONES = [
  { lat: 27.6800, lng: -97.2400, radius: 2 }, // Oso Bay area
  { lat: 27.7200, lng: -97.2800, radius: 1.5 }, // Laguna Madre
  { lat: 27.8300, lng: -97.3500, radius: 1 }, // Port area
];

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

class EvacuationService {
  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  /**
   * Calculate safety score for a safe zone based on multiple factors
   */
  calculateSafetyScore(zone, origin, hazardInfo) {
    const distance = this.calculateDistance(origin, zone);
    
    // Distance score (closer is better, but not too close to hazard)
    const distanceScore = distance < 50 ? (1 / (distance + 1)) * 100 : 10;
    
    // Capacity score (more capacity is better)
    const capacityScore = (zone.capacity / 3000) * 100;
    
    // Type match score (matching facility type gets bonus)
    let typeScore = 50;
    if (hazardInfo?.needsMedical && zone.type === 'medical_facility') {
      typeScore = 100;
    } else if (hazardInfo?.needsPets && zone.facilities.includes('pet_friendly')) {
      typeScore = 80;
    } else if (hazardInfo?.specialNeeds && zone.facilities.includes('special_needs')) {
      typeScore = 90;
    }
    
    // Facility score (more facilities is better)
    const facilityScore = (zone.facilities.length / 4) * 100;
    
    // Check if zone is in flood zone
    const inFloodZone = FLOOD_ZONES.some(fz => 
      this.calculateDistance(zone, fz) < fz.radius
    );
    const floodPenalty = inFloodZone ? 0.5 : 1;
    
    // Weighted average
    const totalScore = (
      distanceScore * 0.3 +
      capacityScore * 0.2 +
      typeScore * 0.3 +
      facilityScore * 0.2
    ) * floodPenalty;
    
    return Math.round(totalScore);
  }

  /**
   * Find best safe zones based on origin and hazard information
   */
  findBestSafeZones(origin, hazardInfo = {}, count = 3) {
    return CORPUS_CHRISTI_SAFE_ZONES
      .map(zone => ({
        ...zone,
        distance: this.calculateDistance(origin, zone),
        score: this.calculateSafetyScore(zone, origin, hazardInfo)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Fetch route from TomTom API
   */
  async fetchTomTomRoute(origin, destination, options = {}) {
    if (!TOMTOM_API_KEY) {
      throw new Error('TomTom API key not configured');
    }

    const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json`;
    
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      traffic: 'true',
      routeType: options.routeType || 'fastest',
      travelMode: options.travelMode || 'car',
      avoid: options.avoid || 'unpavedRoads',
      departAt: 'now',
      computeTravelTimeFor: 'all',
      instructionsType: 'text',
      language: 'en-US',
      sectionType: 'traffic'
    });

    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching TomTom route:', error);
      throw error;
    }
  }

  /**
   * Get optimal evacuation route with alternatives
   */
  async getEvacuationRoutes(origin, hazardInfo = {}) {
    const bestZones = this.findBestSafeZones(origin, hazardInfo, 3);
    
    const routes = await Promise.allSettled(
      bestZones.map(async (zone) => {
        try {
          const routeData = await this.fetchTomTomRoute(origin, zone);
          const route = routeData.routes?.[0];
          
          if (!route) {
            throw new Error('No route found');
          }
          
          return {
            destination: zone,
            route: route,
            summary: {
              distance: route.summary.lengthInMeters,
              distanceKm: (route.summary.lengthInMeters / 1000).toFixed(1),
              distanceMiles: (route.summary.lengthInMeters / 1609.34).toFixed(1),
              duration: route.summary.travelTimeInSeconds,
              durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
              trafficDelay: route.summary.trafficDelayInSeconds,
              departureTime: route.summary.departureTime,
              arrivalTime: route.summary.arrivalTime
            },
            legs: route.legs,
            sections: route.sections,
            guidance: route.guidance
          };
        } catch (error) {
          console.error(`Error fetching route to ${zone.name}:`, error);
          return null;
        }
      })
    );

    const validRoutes = routes
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    if (validRoutes.length === 0) {
      // Fallback to direct distance calculation
      return bestZones.map(zone => ({
        destination: zone,
        route: null,
        summary: {
          distance: zone.distance * 1000,
          distanceKm: zone.distance.toFixed(1),
          distanceMiles: (zone.distance * 0.621371).toFixed(1),
          duration: null,
          durationMinutes: Math.round(zone.distance * 2), // Rough estimate
          trafficDelay: 0,
          departureTime: null,
          arrivalTime: null
        },
        fallback: true
      }));
    }

    return validRoutes;
  }

  /**
   * Get user's current location using browser geolocation
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Geocode an address to coordinates using TomTom
   */
  async geocodeAddress(address) {
    if (!TOMTOM_API_KEY) {
      throw new Error('TomTom API key not configured');
    }

    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json`;
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      limit: 1,
      countrySet: 'US',
      lat: 27.8006, // Corpus Christi center
      lon: -97.3964
    });

    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`TomTom Geocoding API error: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.position.lat,
          lng: result.position.lon,
          address: result.address.freeformAddress
        };
      }
      
      throw new Error('No results found for address');
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }
}

export const evacuationService = new EvacuationService();
