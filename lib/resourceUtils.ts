// Types for the Resource and Processed Result
export interface Resource {
  id: string;
  name: string;
  type: 'food' | 'shelter' | 'services';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  schedule: {
    days: string[];
    start_time: string;
    end_time: string;
    type: 'fixed' | 'variable' | 'intake';
  };
  last_updated: string;
  source: string;
  notes: string;
}

export interface ResourceResult {
  id: string;
  name: string;
  type: 'food' | 'shelter' | 'services';
  distance: number;
  status: 'OPEN_NOW' | 'STARTING_SOON' | 'CLOSED' | 'UNKNOWN';
  start_time: string;
  end_time: string;
  last_updated_minutes: number;
  score: number;
}

// Haversine formula to calculate distance in miles
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get the current time in America/Los_Angeles
export function getNowInLA(): Date {
  const now = new Date();
  const laString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  return new Date(laString);
}

/**
 * Ranks and filters resources based on proximity, current status, and type.
 */
export function rankResources(
  resources: Resource[],
  userLat: number,
  userLng: number,
  filterType: string | null
): ResourceResult[] {
  const now = getNowInLA();
  const currentDay = now.toLocaleString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' });
  const currentTimeStr = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: 'America/Los_Angeles' 
  });

  // Filter by type if provided
  let filtered = filterType 
    ? resources.filter(r => r.type === filterType) 
    : resources;

  const results = filtered.map(resource => {
    const distance = parseFloat(getDistance(userLat, userLng, resource.location.lat, resource.location.lng).toFixed(1));
    
    let status: 'OPEN_NOW' | 'STARTING_SOON' | 'CLOSED' | 'UNKNOWN' = 'CLOSED';
    
    // Status Detection
    if (resource.schedule.type !== 'fixed') {
        status = 'UNKNOWN';
    } else if (resource.schedule.days.includes(currentDay)) {
        const start = resource.schedule.start_time;
        const end = resource.schedule.end_time;
        
        if (currentTimeStr >= start && currentTimeStr <= end) {
            status = 'OPEN_NOW';
        } else {
            // Check for STARTING_SOON (within 60 min)
            const [cHour, cMin] = currentTimeStr.split(':').map(Number);
            const [sHour, sMin] = start.split(':').map(Number);
            
            const currentTotalMin = cHour * 60 + cMin;
            const startTotalMin = sHour * 60 + sMin;
            
            if (startTotalMin > currentTotalMin && startTotalMin - currentTotalMin <= 60) {
                status = 'STARTING_SOON';
            }
        }
    }

    // Ranking Score
    let status_weight = 0;
    if (status === 'OPEN_NOW') status_weight = 100;
    else if (status === 'STARTING_SOON') status_weight = 50;
    else if (status === 'UNKNOWN') status_weight = 10;
    
    const distance_weight = -1 * distance;
    
    // Freshness Weight
    let freshness_weight = 0;
    const lastUpdated = new Date(resource.last_updated);
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const last_updated_minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    if (diffHours < 1) freshness_weight = 20;
    else if (diffHours < 24) freshness_weight = 10;

    const score = status_weight + distance_weight + freshness_weight;

    return {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      distance: distance,
      status: status,
      start_time: resource.schedule.start_time,
      end_time: resource.schedule.end_time,
      last_updated_minutes: last_updated_minutes,
      score: Math.round(score)
    };
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score).slice(0, 50);
}
