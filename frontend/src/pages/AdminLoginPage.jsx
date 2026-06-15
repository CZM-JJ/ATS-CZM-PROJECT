import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form, remember)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError('Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f3d2e] relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#B8860B] rounded-full blur-3xl opacity-30"></div>

        <div className="relative z-10 max-w-lg text-center">
          <img
            src="/LOGO_CZM MAIN 01.png"
            alt="Czark Mak Corporation"
            className="w-24 h-24 mx-auto mb-8 object-contain brightness-0 invert"
          />
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Efficiently Manage <br />
            <span className="text-[#D4AF37]">Your Top Talent</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-8 leading-relaxed opacity-90">
            The comprehensive Applicant Tracking System designed for the modern recruitment workflow.
            Streamline your pipeline, collaborate with your team, and hire faster.
          </p>
          <div className="flex justify-center gap-4">
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37]">
               ✓ Advanced Analytics
             </div>
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37]">
               ✓ Role-Based Access
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <div className="text-left lg:text-center mb-10 lg:hidden">
             <img src="/LOGO_CZM MAIN 01.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
          </div>

          <div className="hidden lg:block text-center mb-10">
             <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
             <p className="text-gray-500">Please enter your details to sign in</p>
             <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-4 rounded-full"></div>
          </div>

          {error && (
            <div className="mb-6 py-3 px-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.5.5 0 01.5.5 .5.5 0 01-.5.5 0 01-.5-.5 0 01.5-.5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#B8860B] transition-colors">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#B8860B] transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#B8860B] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243-4.243m-4.243 4.243l.5-1.5m0 0l.5 1.5m-1-1.5h.01" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-[#0f3d2e] peer-checked:border-[#0f3d2e] transition-all duration-200" />
                  <svg
                    className="absolute w-3.5 h-3.5 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors font-medium">Remember me</span>
              </label>
              <a href="/admin/forgot-password" className="text-sm font-bold text-[#B8860B] hover:text-[#D4AF37] transition-colors hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white font-bold transition-all ${
                loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#0f3d2e] hover:bg-[#14523f] active:scale-[0.98] shadow-lg shadow-emerald-900/20 border-b-4 border-[#D4AF37]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8V12H4z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
