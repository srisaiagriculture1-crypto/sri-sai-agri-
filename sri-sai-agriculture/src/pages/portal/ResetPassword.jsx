import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "/api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/students/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/portal/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Token might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-blue p-10 text-center relative">
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 mx-auto mb-4 flex items-center justify-center shadow-lg">
             <img src="/logo.png" alt="Sri Sai Agricultural College Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-white font-lora text-2xl font-bold">Reset Password</h1>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sri Sai Agricultural College</p>
        </div>

        <form onSubmit={handleReset} className="p-10 pt-12 space-y-6">
          {message ? (
            <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-bold border border-green-100 animate-pulse">
              {message} Redirecting to login...
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue focus:ring-4 focus:ring-blue/5 outline-none transition-all font-bold text-ink"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input 
                  required 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue focus:ring-4 focus:ring-blue/5 outline-none transition-all font-bold text-ink"
                  placeholder="••••••••"
                />
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-blue text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
