// components/StatCard.jsx
import { Icon } from '@iconify/react';

const StatCard = ({ icon, title, value, trend, trendColor, additionalText }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${getBgColor(icon)} ${getTextColor(icon)}`}>
          <Icon icon={getIcon(icon)} className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
          {trend && (
            <p className={`text-xs ${trendColor} mt-1`}>
              {trend}
            </p>
          )}
          {additionalText && (
            <p className="text-xs text-gray-500 mt-1">{additionalText}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for icon mapping
const getIcon = (icon) => {
  const icons = {
    users: 'carbon:user',
    certificates: 'carbon:certificate',
    trainers: 'carbon:user-certification',
    projects: 'carbon:task',
    revenue: 'carbon:money',
    expenses: 'carbon:receipt',
    active: 'carbon:checkmark-outline'
  };
  return icons[icon] || 'carbon:circle-dash';
};

const getBgColor = (icon) => {
  const colors = {
    users: 'bg-blue-100',
    certificates: 'bg-green-100',
    trainers: 'bg-purple-100',
    projects: 'bg-yellow-100',
    revenue: 'bg-teal-100',
    expenses: 'bg-red-100',
    active: 'bg-indigo-100'
  };
  return colors[icon] || 'bg-gray-100';
};

const getTextColor = (icon) => {
  const colors = {
    users: 'text-blue-600',
    certificates: 'text-green-600',
    trainers: 'text-purple-600',
    projects: 'text-yellow-600',
    revenue: 'text-teal-600',
    expenses: 'text-red-600',
    active: 'text-indigo-600'
  };
  return colors[icon] || 'text-gray-600';
};

export default StatCard;