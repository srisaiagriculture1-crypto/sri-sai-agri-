import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";

const API_URL = "/api";

export default function SuperAdminResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/admin/reset-password/${token}`, { password });
      setMessage(res.data.message || "Super Admin password reset successfully!");
      setTimeout(() => navigate("/super-admin/dashboard"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Token might be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sora">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue/20">
            S
          </div>
          <h1 className="text-2xl font-bold text-ink">Super Admin Panel</h1>
          <p className="text-gray-400 text-xs font-semibold mt-1">Set Your New Super Admin Password</p>
        </div>

        {message ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle size={32} />
            </div>
            <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-bold border border-green-100">
              {message}
            </div>
            <p className="text-gray-400 text-xs">Redirecting to Super Admin Login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue outline-none transition-all text-sm font-medium text-ink"
                  placeholder="••••••••"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue outline-none transition-all text-sm font-medium text-ink"
                  placeholder="••••••••"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-ink text-white py-4 rounded-xl font-bold hover:bg-blue transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>

            <div className="text-center pt-2">
              <Link to="/super-admin/dashboard" className="text-xs text-gray-500 hover:text-ink font-bold inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Back to Super Admin Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
