'use client';

import { useState, useEffect, useCallback } from 'react';
import ResourceCard from '@/components/ResourceCard';
import FilterBar from '@/components/FilterBar';
import { rankResources, ResourceResult, Resource } from '@/lib/resourceUtils';
import rawResources from '../data/resources.json';

export default function Home() {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [resources, setResources] = useState<ResourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const processResources = useCallback((lat: number, lng: number, type: string | null) => {
    try {
      setLoading(true);
      // Directly process the imported JSON data (Static/Option A)
      const ranked = rankResources(rawResources as Resource[], lat, lng, type);
      setResources(ranked);
      setError(null);
    } catch (err) {
      setError('Unable to load resources. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          processResources(latitude, longitude, filter);
        },
        (err) => {
          setError('Location access denied. Showing results for San Francisco.');
          // Default to SF Civic Center
          const defaultLat = 37.7794;
          const defaultLng = -122.4168;
          setLocation({ lat: defaultLat, lng: defaultLng });
          processResources(defaultLat, defaultLng, filter);
        }
      );
    } else {
      setError('Geolocation not supported by your browser.');
    }
  }, [filter, processResources]);

  const handleFilterChange = (newFilter: string | null) => {
    setFilter(newFilter);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tighter">NearbyNeed</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live Feed
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1 leading-tight">
            🔥 Available now near you
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Finding $0 resources within San Francisco & Oakland.
          </p>
        </div>

        <FilterBar currentType={filter} onTypeChange={handleFilterChange} />

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-start gap-3">
             <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
             </svg>
             {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-xl border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {resources.length > 0 ? (
              resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="text-4xl mb-4 opacity-50">🔭</div>
                <h3 className="font-bold text-slate-800">No resources found</h3>
                <p className="text-slate-500 text-sm">Try changing your filters or location.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-md mx-auto px-4 mt-12 pt-8 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
          NearbyNeed &bull; Community Pilot 2026<br/>
          Zero-Money Guarantee &bull; Verified Data
        </p>
      </footer>
    </div>
  );
}
