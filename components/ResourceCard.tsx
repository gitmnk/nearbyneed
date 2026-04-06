import React from 'react';

interface ResourceResult {
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
      </div>
    </div>
  );
};

export default ResourceCard;
