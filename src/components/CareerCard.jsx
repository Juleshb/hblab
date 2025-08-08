import React from 'react';
import { Icon } from '@iconify/react';

const CareerCard = ({ career, BACKEND_URL, actions }) => {
  const { title, type, location, description, startDate, endDate, imageUrl } = career;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden border border-green-100/50 h-full">
      <div className="relative">
        {imageUrl ? (
          <img
            src={`${BACKEND_URL}${imageUrl}`}
            alt={`${title} banner`}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-green-50 to-teal-50 flex items-center justify-center">
            <Icon icon="carbon:building" className="text-green-500 text-5xl opacity-50" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-green-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          {type ? type.replace('_', ' ') : 'N/A'}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-lg font-bold text-green-900 truncate">{title}</h4>
        <div className="flex items-center text-sm text-gray-600 mt-1 mb-3">
          <Icon icon="carbon:location" className="mr-1.5 text-green-700" />
          <span>{location}</span>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 flex-grow">{description}</p>

        <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100 flex items-center">
          <Icon icon="carbon:calendar" className="h-4 w-4 mr-2 text-green-700 opacity-80" />
          <span className="font-medium text-gray-700">
            {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}
          </span>
          <span className="text-gray-400 mx-1.5">→</span>
          <span className="font-medium text-gray-700">
            {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        
        {/* Action buttons will be rendered here */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {actions}
        </div>
      </div>
    </div>
  );
};

export default CareerCard; 