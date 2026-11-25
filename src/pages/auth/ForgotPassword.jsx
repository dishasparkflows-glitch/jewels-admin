import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { getMediaUrl } from '../../utils/imageUrl';
import {
  HiOutlineMail,
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setBrandLogo(getMediaUrl(data?.data?.logoImage?.url)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim(),
        portal: 'admin',
      });
      setSent(true);
      toast.success(data?.message || 'Check your email for a password reset link.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
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
            RECOVER ACCESS
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <HiOutlineCheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-stone-900">Check Your Inbox</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                If an account exists for <span className="font-semibold text-stone-700">{email}</span>, we have sent a secure password reset link to your email.
              </p>
              <p className="text-[11px] text-stone-400">
                The link expires in 1 hour. Be sure to check your spam or junk folder.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all"
              >
                Send to another email
              </button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#8b6f4e] hover:text-[#785e40] transition-colors py-1"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-sm font-semibold text-stone-800">Forgot Password?</h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter your admin email address and we'll send you a password reset link.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neirah.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                  required
                  autoFocus
                />
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
                'Send Reset Link'
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

export default ForgotPassword;
