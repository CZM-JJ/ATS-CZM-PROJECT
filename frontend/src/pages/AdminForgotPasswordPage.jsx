import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { authAPI } from '../services/api'

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Unable to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f3d2e] relative overflow-hidden items-center justify-center p-12 text-white">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#B8860B] rounded-full blur-3xl opacity-30"></div>

        <div className="relative z-10 max-w-lg text-center">
          <img
            src="/LOGO_CZM MAIN 01.png"
            alt="Czark Mak Corporation"
            className="w-24 h-24 mx-auto mb-8 object-contain brightness-0 invert"
          />
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Restore Your <br />
            <span className="text-[#D4AF37]">Secure Access</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-8 leading-relaxed opacity-90">
            Don't worry, it happens to the best of us.
            Enter your professional email and we'll send you a secure link to reset your password instantly.
          </p>
          <div className="flex justify-center gap-4">
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37]">
               ✓ Secure Encryption
             </div>
             <div className="px-4 py-2 bg-[#D4AF37]/10 rounded-full text-xs font-medium backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37]">
               ✓ Instant Delivery
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white">
        <div className="w-full max-w-md relative">
          {/* Gold Accent Line */}
          <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <div className="text-left lg:text-center mb-10 lg:hidden">
             <img src="/LOGO_CZM MAIN 01.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
          </div>

          <div className="hidden lg:block text-center mb-10">
             <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
             <p className="text-gray-500">Enter your email to receive a recovery link</p>
             <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-4 rounded-full"></div>
          </div>

          {sent ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border-2 border-emerald-100 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-gray-500 mb-8">
                We sent a reset link to <br />
                <span className="font-semibold text-gray-800">{email}</span>
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(null) }}
                  className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Try again
                </button>
                <NavLink
                  to="/admin/login"
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors hover:underline"
                >
                  ← Back to Sign In
                </NavLink>
              </div>
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold transition-all ${
                    loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#0f3d2e] hover:bg-[#14523f] active:scale-[0.9 la shadow-lg shadow-emerald-900/20 border-b-4 border-[#D4AF37]'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8V12H4z"></path>
                      </svg>
                      Sending link...
                    </span>
                  ) : 'Send Reset Link'}
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

export default AdminForgotPasswordPage
