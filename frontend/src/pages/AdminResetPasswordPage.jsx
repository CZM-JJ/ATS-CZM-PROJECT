import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function StrengthBar({ password }) {
  const score = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-gray-200', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? colors[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500" style={{ color: score > 0 ? colors[score].replace('bg-', '') : '' }}>
        {labels[score]}
      </span>
    </div>
  )
}

function AdminResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const token = query.get('token') || ''
  const email = query.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!token || !email) { setError('Reset link is missing required details.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (getStrength(password) < 2) { setError('Password is too weak. Add uppercase letters, numbers or symbols.'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword({ token, email, password, password_confirmation: confirmPassword })
      setDone(true)
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch {
      setError('Unable to reset password. Please try again.')
    } finally { setLoading(false) }
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
            Secure Your <br />
            <span className="text-[#D4AF37]">Digital Vault</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-8 leading-relaxed opacity-90">
            Create a strong password to protect your administrative access.
            Your security is our priority.
          </p>
          <div className="flex justify-center gap-4">
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF3 own-S la de 30 text-[#D4AF37]">
               ✓ High Entropy
             </div>
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37]">
               ✓ End-to-End Encrypted
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <div className="text-left lg:text-center mb-10 lg:hidden">
             <img src="/LOGO_CZM MAIN 01.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          </div>

          <div className="hidden lg:block text-center mb-10">
             <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h2>
             <p className="text-gray-500">Setting new password for <strong className="text-gray-800">{email || 'your account'}</strong></p>
             <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-4 rounded-full"></div>
          </div>

          {done ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border-2 border-emerald-100 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h3>
              <p className="text-gray-500 mb-8">
                Your password has been changed successfully.<br />Redirecting you to sign in...
              </p>
              <NavLink
                to="/admin/login"
                className="inline-block px-6 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Go to Sign In Now
              </NavLink>
            </div>
          ) : (
            <>
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
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#B8860B] transition-colors"
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
                  <StrengthBar password={password} />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-[#B8860B] transition-colors">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#B8860B] transition-colors"
                    >
                      {showConfirm ? (
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
                      Updating password...
                    </span>
                  ) : 'Update Password'}
                </button>

                <div className="text-center">
                  <NavLink to="/admin/login" className="text-sm font-semibold text-[#B8860B] hover:text-[#D4AF37] transition-colors hover:underline">
                    ← Back to Sign In
                  </NavLink>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminResetPasswordPage
