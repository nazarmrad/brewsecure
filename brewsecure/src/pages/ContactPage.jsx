import { useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? '/api'

export default function ContactPage() {

  const [form, setForm] = useState({ name: '', number: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.number.trim()) e.number = 'Required'
    else if (!/^[\d\s\+\-\(\)]{6,20}$/.test(form.number.trim())) e.number = 'Enter a valid phone number'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    setSubmitError('')
    try {
      await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'otp_request', name: form.name, number: form.number }),
      })
      setOtpOpen(true)
    } catch {
      setSubmitError('Failed to send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit() {
    if (!otp.trim()) { setOtpError('Please enter the OTP'); return }
    setOtpLoading(true)
    setOtpError('')
    try {
      await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'submit', name: form.name, number: form.number, notes: form.notes, otp }),
      })
      setOtpOpen(false)
      setSuccess(true)
    } catch {
      setOtpError('Verification failed. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  function field(key, placeholder, type = 'text', multiline = false) {
    const base = `w-full px-4 py-3 rounded-2xl border text-sm bg-white outline-none focus:border-[#C4602A] transition-colors ${errors[key] ? 'border-red-400' : 'border-[#E8DDD5]'}`
    return (
      <div>
        {multiline
          ? <textarea rows={4} placeholder={placeholder} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className={`${base} resize-none`} />
          : <input type={type} placeholder={placeholder} value={form[key]}
              onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(err => ({ ...err, [key]: '' })) }}
              className={base} />
        }
        {errors[key] && <p className="text-xs text-red-500 mt-1 ml-1">{errors[key]}</p>}
      </div>
    )
  }

  if (success) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#2C5F2E]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#2C5F2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-semibold text-[#1C0F0A] mb-3">We'll be in touch!</h1>
        <p className="text-[#8B5E3C] text-sm">Thanks, {form.name}. Your message has been received.</p>
      </div>
    </div>
  )

  return (
    <div className="pt-24 min-h-screen px-6 pb-20">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-4xl font-semibold text-[#1C0F0A] mb-2">Get in touch</h1>
        <p className="text-[#8B5E3C] text-sm mb-10">Fill in your details and we'll reach out shortly.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {field('name', 'Your name')}
          {field('number', 'Phone number', 'tel')}
          {field('notes', 'Notes (optional)', 'text', true)}

          {submitError && <p className="text-xs text-red-500">{submitError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#C4602A] text-white font-semibold text-sm hover:bg-[#A04E22] transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>

      {/* OTP modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8">
            <h2 className="font-display text-2xl font-semibold text-[#1C0F0A] mb-2">Verify your number</h2>
            <p className="text-[#8B5E3C] text-sm mb-6">Enter the OTP sent to <span className="font-semibold text-[#1C0F0A]">{form.number}</span>.</p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => { setOtp(e.target.value); setOtpError('') }}
              className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD5] text-sm bg-[#FAF7F2] outline-none focus:border-[#C4602A] transition-colors text-center tracking-widest text-lg mb-2"
            />
            {otpError && <p className="text-xs text-red-500 mb-3 text-center">{otpError}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setOtpOpen(false); setOtp(''); setOtpError('') }}
                className="flex-1 py-3 rounded-full border border-[#E8DDD5] text-sm font-medium text-[#8B5E3C] hover:bg-[#FAF7F2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOtpSubmit}
                disabled={otpLoading}
                className="flex-1 py-3 rounded-full bg-[#C4602A] text-white text-sm font-semibold hover:bg-[#A04E22] transition-colors disabled:opacity-60"
              >
                {otpLoading ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
