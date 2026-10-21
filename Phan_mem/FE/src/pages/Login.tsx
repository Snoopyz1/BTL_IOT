import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Spinner } from '../components/common/Loading';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.usernameOrEmail.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email!');
      return;
    }

    if (!form.password) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }

    const res = await login({
      usernameOrEmail: form.usernameOrEmail,
      password: form.password,
      rememberMe: form.rememberMe,
    });

    if (res.success) {
      showToast('Đăng nhập thành công! Chào mừng trở lại.', 'success');
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.message);
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary-50 via-surface-50 to-primary-100/50 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md glass-card p-8 rounded-2xl shadow-xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md mb-3">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-800">SmartHome IoT</h1>
          <p className="text-xs text-surface-500 mt-1">Đăng nhập để quản lý ngôi nhà thông minh của bạn</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600 animate-slide-up">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.usernameOrEmail}
                onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                placeholder="Nhập username hoặc email"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-surface-200 bg-white/80 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-surface-600">
                Mật khẩu
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); showToast('Vui lòng liên hệ Admin để khôi phục mật khẩu!', 'info'); }} className="text-xs text-primary-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-surface-200 bg-white/80 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-surface-600">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              Ghi nhớ đăng nhập
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-surface-500 border-t border-surface-100 pt-4">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
