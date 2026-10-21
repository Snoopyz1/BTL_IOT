import { Mail, MapPin, Calendar, Shield } from 'lucide-react';
import type { User } from '../../types/user.ts';

interface ProfileCardProps {
  user: User;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const joinDate = new Date(user.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const roleLabels: Record<string, string> = {
    Administrator: 'Quản trị viên',
    User: 'Người dùng',
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-primary-100">
          {user.fullName.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-xl font-bold text-surface-800 mt-4">{user.fullName}</h2>
        <p className="text-sm text-surface-500 mt-0.5">@{user.username}</p>

        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
            {roleLabels[user.role] || user.role}
          </span>
        </div>

        <div className="w-full mt-5 space-y-2.5">
          <div className="flex items-center gap-3 text-sm text-surface-600">
            <Mail className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-surface-600">
            <MapPin className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <span>{user.address}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-surface-600">
            <Calendar className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <span>Tham gia từ {joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
