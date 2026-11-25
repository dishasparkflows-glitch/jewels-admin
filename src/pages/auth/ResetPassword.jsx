import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { getMediaUrl } from '../../utils/imageUrl';
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setBrandLogo(getMediaUrl(data?.data?.logoImage?.url)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing. Please request a new reset link.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
      toast.success('Password reset successfully! Redirecting to login...', { icon: '✨' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center mx-auto mb-3 shadow-xs overflow-hidden">
            {brandLogo ? (
              <img src={brandLogo} alt="Neirah Jewellers" className="max-w-full max-h-full object-contain p-1" />
            ) : (
              <HiOutlineSparkles className="w-6 h-6 text-[#8b6f4e]" />
            )}
          </div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-stone-900 uppercase">
            NEIRAH JEWELLERS
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-[#8b6f4e] font-semibold uppercase">
            RESET PASSWORD
          </p>
        </div>

        {!token ? (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <HiOutlineExclamationCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-stone-900">Invalid or Missing Link</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                This password reset link is invalid or missing required security tokens. Please request a new link.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <HiOutlineCheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-stone-900">Password Reset Successfully</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Your portal password has been updated. You will be redirected to the login page shortly.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-sm font-semibold text-stone-800">Set New Password</h2>
              <p className="text-xs text-stone-500 mt-1">
                Choose a strong new password for your administrator account.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                  required
                  autoFocus
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

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showConfirmPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-[#8b6f4e]/20 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>

            <div className="text-center pt-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        <p className="text-center text-[10px] text-stone-400 mt-8 tracking-wider">
          Protected Luxury Portal • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
