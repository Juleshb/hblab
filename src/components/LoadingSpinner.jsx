// components/LoadingSpinner.jsx
import React from 'react';
import { Icon } from '@iconify/react';

const LoadingSpinner = ({ message = "Loading, please wait…", size = "large" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12"
  };

  const textSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm">
      <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm mx-4">
        {/* Irembo-style loading animation */}
        <div className="relative mb-6">
          {/* Outer ring */}
          <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-pulse`}></div>
          
          {/* Spinning inner ring */}
          <div className={`${sizeClasses[size]} border-4 border-transparent border-t-green-600 rounded-full animate-spin absolute top-0 left-0`}></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon 
              icon="carbon:checkmark" 
              className={`${size === 'large' ? 'h-6 w-6' : size === 'medium' ? 'h-4 w-4' : 'h-3 w-3'} text-green-600 animate-pulse`} 
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h3 className={`${textSizes[size]} font-semibold text-gray-900 mb-2`}>
            Processing Request
          </h3>
          <p className={`${textSizes[size]} text-gray-600`}>
            {message}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2 mt-6">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Inline loading spinner for smaller contexts
export const InlineSpinner = ({ size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8"
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-green-600 rounded-full animate-spin`}></div>
    </div>
  );
};

// Button loading spinner
export const ButtonSpinner = ({ size = "small" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-5 w-5",
    large: "h-6 w-6"
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  );
};

// Page loading spinner
export const PageSpinner = ({ title = "Loading Page", subtitle = "Please wait while we prepare your content" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md mx-4">
        {/* Government-style logo placeholder */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Icon icon="carbon:building" className="h-8 w-8 text-white" />
        </div>

        {/* Loading animation */}
        <div className="relative mb-6">
          <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-pulse mx-auto"></div>
          <div className="h-12 w-12 border-4 border-transparent border-t-green-600 rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>

        {/* Text content */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{subtitle}</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* Status text */}
        <p className="text-sm text-gray-500">Initializing system...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
