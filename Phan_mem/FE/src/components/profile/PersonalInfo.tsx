import { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import type { User, UserUpdatePayload } from '../../types/user.ts';
import { updateProfile } from '../../services/profileService.ts';
import { useToast } from '../common/Toast.tsx';
import { Spinner } from '../common/Loading.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface PersonalInfoProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function PersonalInfo({ user, onUpdate }: PersonalInfoProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    github: user.socialLinks?.github || 'https://github.com/Snoopyz1/BTL_IOT',
    postman:
      user.socialLinks?.postman ||
      'https://hoang2005cc-3372547.postman.co/workspace/5b8f1684-4063-45f7-82c7-0028ee682c3a/documentation/57489199-fd2ce726-1f9e-4507-bd6d-8758f08ce6de',
  });

  const handleEdit = () => {
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      github: user.socialLinks?.github || 'https://github.com/Snoopyz1/BTL_IOT',
      postman:
        user.socialLinks?.postman ||
        'https://hoang2005cc-3372547.postman.co/workspace/5b8f1684-4063-45f7-82c7-0028ee682c3a/documentation/57489199-fd2ce726-1f9e-4507-bd6d-8758f08ce6de',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UserUpdatePayload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        socialLinks: {
          ...user.socialLinks,
          github: form.github,
          postman: form.postman,
        },
      };
      const updated = await updateProfile(payload);
      updateUser(updated);
      onUpdate(updated);
      setEditing(false);
      showToast('Cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật thất bại!', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all";
  const readonlyClass = "w-full h-10 px-3 rounded-lg bg-surface-50 border border-surface-100 text-sm text-surface-700 flex items-center";

  const fields = [
    { key: 'fullName', label: 'Họ và tên', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Số điện thoại', type: 'text' },
    { key: 'dateOfBirth', label: 'Ngày sinh', type: 'date' },
    { key: 'address', label: 'Địa chỉ', type: 'text' },
    { key: 'github', label: 'GitHub Repository', type: 'url' },
    { key: 'postman', label: 'Postman Documentation', type: 'url' },
  ] as const;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-surface-800">Thông Tin Cá Nhân</h3>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-surface-500 hover:bg-surface-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-60"
            >
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-500">{field.label}</label>
            {editing ? (
              <input
                type={field.type}
                value={form[field.key as keyof typeof form] || ''}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className={inputClass}
              />
            ) : (
              <div className={readonlyClass}>
                {field.key === 'dateOfBirth'
                  ? (user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '—')
                  : field.key === 'github'
                  ? (
                    <a
                      href={form.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate"
                    >
                      {form.github}
                    </a>
                  )
                  : field.key === 'postman'
                  ? (
                    <a
                      href={form.postman}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline truncate"
                    >
                      {form.postman}
                    </a>
                  )
                  : (user[field.key as keyof User] as string || '—')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
