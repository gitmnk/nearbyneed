import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Schema for Resource
interface Resource {
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
  confidence: 'high' | 'medium' | 'low';
}

// Haversine formula to calculate distance in miles
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
function getNowInLA(): Date {
    const now = new Date();
    const laString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    return new Date(laString);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const type = searchParams.get('type');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  // Load resources
  const dataPath = path.join(process.cwd(), 'data', 'resources.json');
  const fileContent = await fs.readFile(dataPath, 'utf8');
  let resources: Resource[] = JSON.parse(fileContent);

  // Filter by type if provided
  if (type) {
    resources = resources.filter(r => r.type === type);
  }

  const now = getNowInLA();
  const currentDay = now.toLocaleString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' });
  const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  
  const results = resources.map(resource => {
    const distance = parseFloat(getDistance(lat, lng, resource.location.lat, resource.location.lng).toFixed(1));
    
    let status: 'OPEN_NOW' | 'STARTING_SOON' | 'CLOSED' | 'UNKNOWN' = 'CLOSED';
    
    // Status Detection
    if (resource.schedule.type !== 'fixed') {
        status = 'UNKNOWN';
    } else if (resource.schedule.days.includes(currentDay)) {
        const start = resource.schedule.start_time;
        const end = resource.schedule.end_time;
        
        // Simple string comparison for HH:MM (since they are 24h format)
        if (currentTimeStr >= start && currentTimeStr <= end) {
            status = 'OPEN_NOW';
        } else {
            // Check for STARTING_SOON (within 60 min)
            const [cHour, cMin] = currentTimeStr.split(':').map(Number);
            const [sHour, sMin] = start.split(':').map(Number);
            
            const currentTotalMin = cHour * 60 + cMin;
            const startTotalMin = sHour * 60 + sMin;
            
            // Critical case: starts at 11:00, current time is 10:30 (starts in 30 min)
            if (startTotalMin > currentTotalMin && startTotalMin - currentTotalMin <= 60) {
                status = 'STARTING_SOON';
            }
        }
    } else {
        status = 'CLOSED';
    }

    // Ranking Score calculation
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
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({ results: results.slice(0, 20) });
}
