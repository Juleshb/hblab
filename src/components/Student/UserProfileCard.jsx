import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext';

const UserProfileCard = ({ compact = false }) => {
    const { user } = useAuth();
    const avatarUrl = user?.avatar || '/src/assets/avatar.png';

    if (compact) {
        // Minimal sidebar version: no profile picture, just name, status, specialization
        return (
            <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 mb-4">
                <div className="flex flex-col items-start gap-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold mb-1">{user?.status || 'Active'}</span>
                    <p className="font-semibold text-white text-base">{user?.name || 'Student'}</p>
                    <p className="text-xs text-green-200">{user?.specialization || 'No specialization set'}</p>
                </div>
            </div>
        );
    }

    // Full profile card for profile page
    return (
        <div className="w-full max-w-lg mx-auto relative">
            {/* Card background gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-100 via-white to-green-50 blur-sm opacity-80 z-0" />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-green-100 hover:shadow-green-200 transition-shadow duration-300">
                {/* Profile Image */}
                <div className="relative mb-4 group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 p-1 shadow-lg flex items-center justify-center ring-4 ring-green-200 group-hover:ring-green-400 transition-all duration-300">
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-28 h-28 rounded-full object-cover border-2 border-white shadow"
                            onError={e => { e.target.onerror = null; e.target.src = '/src/assets/avatar.png'; }}
                        />
                    </div>
                    <span className="absolute bottom-3 right-3 w-5 h-5 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                    </span>
                </div>
                {/* Name and Status */}
                <h2 className="text-3xl font-extrabold text-gray-800 mb-1 flex items-center gap-2">
                    {user?.name || 'Student'}
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold ml-2">{user?.status || 'Active'}</span>
                </h2>
                <p className="text-green-700 text-base mb-2 font-medium">{user?.specialization || 'No specialization set'}</p>
                {/* Divider */}
                <div className="w-full border-t border-green-100 my-4" />
                {/* Contact Info */}
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3 text-gray-700 text-base">
                        <Icon icon="carbon:email" className="w-5 h-5 text-green-500" />
                        <span>{user?.email}</span>
                    </div>
                    {user?.phone && (
                        <div className="flex items-center gap-3 text-gray-700 text-base">
                            <Icon icon="carbon:phone" className="w-5 h-5 text-green-500" />
                            <span>{user.phone}</span>
                        </div>
                    )}
                </div>
                {/* Divider */}
                <div className="w-full border-t border-green-100 my-4" />
                {/* Bio */}
                {user?.bio && (
                    <div className="w-full bg-green-50 rounded-lg p-4 text-gray-700 text-base shadow-sm">
                        <span className="font-semibold text-green-700">Bio:</span> {user.bio}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileCard; 