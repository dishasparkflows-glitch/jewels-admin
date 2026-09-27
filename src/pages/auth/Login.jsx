import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineSparkles } from 'react-icons/hi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.firstName}!`, { icon: '✨' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-4 selection:bg-[#8b6f4e] selection:text-white">
      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <HiOutlineSparkles className="w-6 h-6 text-[#8b6f4e]" />
          </div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-stone-900 uppercase">
            NEIRAH JEWELLERS
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-[#8b6f4e] font-semibold uppercase">
            LUXURY PORTAL LOGIN
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@neirah.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-stone-500 text-xs">
              <input type="checkbox" className="rounded border-stone-300 text-[#8b6f4e] focus:ring-0" />
              <span>Remember me</span>
            </label>
            <span className="text-[#8b6f4e] hover:underline cursor-pointer text-xs font-medium">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-[#8b6f4e]/20 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Access Management Portal'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            Protected Luxury Portal • Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
