import { useState, useEffect } from 'react';
import ProfileCard from '../components/profile/ProfileCard.tsx';
import PersonalInfo from '../components/profile/PersonalInfo.tsx';
import DeveloperInfo from '../components/profile/DeveloperInfo.tsx';
import { PageLoader } from '../components/common/Loading.tsx';
import { getProfile } from '../services/profileService.ts';
import type { User } from '../types/user.ts';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="h-full space-y-5 animate-fade-in">
      {/* Top Row: Profile Card (Left) & Personal Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <ProfileCard user={user} />
        </div>
        <div className="lg:col-span-2">
          <PersonalInfo user={user} onUpdate={setUser} />
        </div>
      </div>

      {/* Bottom Row: 4 Independent Horizontal Link Cards */}
      <DeveloperInfo socialLinks={user.socialLinks} />
    </div>
  );
}
