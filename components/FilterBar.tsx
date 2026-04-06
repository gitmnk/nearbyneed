import React from 'react';

interface FilterBarProps {
  currentType: string | null;
  onTypeChange: (type: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ currentType, onTypeChange }) => {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:px-0">
      <button
        onClick={() => onTypeChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border 
          ${!currentType ? 'bg-primary text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
      >
        All
      </button>
      <button
        onClick={() => onTypeChange('food')}
        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
          ${currentType === 'food' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
      >
        Food 🍲
      </button>
      <button
        onClick={() => onTypeChange('shelter')}
        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
          ${currentType === 'shelter' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
      >
        Shelter 🏠
      </button>
      <button
        onClick={() => onTypeChange('services')}
        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
          ${currentType === 'services' ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
      >
        Services ⚙️
      </button>
    </div>
  );
};

export default FilterBar;
