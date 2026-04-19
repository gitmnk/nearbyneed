import React from 'react';
import { ResourceResult } from '@/lib/resourceUtils';

const typeEmojis = {
  food: '🍲',
  shelter: '🏠',
  services: '⚙️'
};

const statusColors = {
  OPEN_NOW: 'bg-green-100 text-green-800 border-green-200',
  STARTING_SOON: 'bg-amber-100 text-amber-800 border-amber-200',
  CLOSED: 'bg-red-100 text-red-800 border-red-200',
  UNKNOWN: 'bg-gray-100 text-gray-800 border-gray-200'
};

const ResourceCard: React.FC<{ resource: ResourceResult }> = ({ resource }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={resource.type}>
            {typeEmojis[resource.type]}
          </span>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{resource.name}</h3>
            <p className="text-slate-500 text-sm font-medium">{resource.distance} miles away</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[resource.status]}`}>
          {resource.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center text-slate-600 text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">
            {resource.status === 'UNKNOWN' ? 'Hours vary - Check details' : `${resource.start_time} - ${resource.end_time}`}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-slate-400 text-xs italic">
            Updated {resource.last_updated_minutes < 60 ? `${resource.last_updated_minutes} min ago` : `${Math.floor(resource.last_updated_minutes / 60)}h ago`}
          </span>
          <div className="bg-slate-50 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded">
            Rank: {resource.score}
          </div>
        </div>

        {/* Actionable Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${resource.location?.lat},${resource.location?.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold py-2 rounded-lg text-center transition-colors flex justify-center items-center gap-1.5"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Directions
          </a>
          {resource.phone && (
             <a 
               href={`tel:${resource.phone.replace(/\D/g, '')}`}
               className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold py-2 rounded-lg text-center transition-colors flex justify-center items-center gap-1.5"
             >
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
               </svg>
               Call
             </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceCard;
