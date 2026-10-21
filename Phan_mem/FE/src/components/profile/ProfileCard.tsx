import { Mail, MapPin, Calendar, Shield } from 'lucide-react';
import type { User } from '../../types/user.ts';

interface ProfileCardProps {
  user: User;
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
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

  const githubUrl = user.socialLinks?.github || 'https://github.com/Snoopyz1/BTL_IOT';

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
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-surface-600 hover:text-primary-600 transition-colors group pt-1 border-t border-surface-100"
          >
            <GithubIcon className="w-4 h-4 text-surface-400 group-hover:text-primary-600 flex-shrink-0" />
            <span className="truncate text-xs font-medium text-primary-600">
              Snoopyz1/BTL_IOT
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
