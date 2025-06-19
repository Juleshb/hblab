// components/Header.jsx
import { Icon } from '@iconify/react';

const Header = ({ toggleMobileSidebar, activeTab }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button 
            onClick={toggleMobileSidebar}
            className="text-gray-500 hover:text-gray-600 lg:hidden mr-4"
          >
            <Icon icon="carbon:menu" className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationButton />
          <ChatButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

const NotificationButton = () => (
  <button className="p-1 text-gray-500 hover:text-gray-600 relative">
    <Icon icon="carbon:notification" className="h-6 w-6" />
    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
  </button>
);

const ChatButton = () => (
  <button className="p-1 text-gray-500 hover:text-gray-600 relative">
    <Icon icon="carbon:chat" className="h-6 w-6" />
    <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-full"></span>
  </button>
);

const UserDropdown = () => (
  <div className="relative">
    <button className="flex items-center space-x-2">
      <Icon 
        icon="carbon:user" 
        className="h-8 w-8 text-gray-600 bg-gray-200 rounded-full p-1.5" 
      />
      <span className="hidden md:inline text-sm font-medium">Admin</span>
    </button>
  </div>
);

export default Header;