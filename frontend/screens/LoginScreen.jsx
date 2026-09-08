import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
      // on success, the component unmounts
    } catch (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
            🏍️
          </div>
          <span className="text-lg font-bold tracking-wide">
            Jakarta <span className="text-blue-500">Motor</span>
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#141923] border border-[#1f293d] rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div>
            <h1 className="text-xl font-bold">Masuk</h1>
            <p className="text-sm text-slate-400 mt-1">
              Gunakan akun yang diberikan pemilik toko
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@toko.com"
              className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
          >
            {isSubmitting ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}