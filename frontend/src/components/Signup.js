import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ 
    full_name: '',
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) {
      setPasswordStrength('weak');
    } else if (strength <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const nameParts = formData.full_name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const userData = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        first_name: first_name,
        last_name: last_name,
        role: 'user',
      };

      const result = await signup(userData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-lavender-50 to-purple-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(1px 1px at 20% 30%, rgba(120,119,198,0.3), transparent),
                            radial-gradient(1px 1px at 60% 70%, rgba(120,119,198,0.2), transparent),
                            radial-gradient(0.5px 0.5px at 50% 50%, rgba(120,119,198,0.4), transparent),
                            radial-gradient(0.5px 0.5px at 80% 10%, rgba(120,119,198,0.3), transparent),
                            radial-gradient(1px 1px at 90% 40%, rgba(120,119,198,0.25), transparent),
                            radial-gradient(0.5px 0.5px at 33% 60%, rgba(120,119,198,0.3), transparent),
                            radial-gradient(0.5px 0.5px at 66% 20%, rgba(120,119,198,0.2), transparent)`,
          backgroundSize: '200% 200%',
          backgroundPosition: '0% 0%',
          animation: 'twinkle 25s ease-in-out infinite alternate'
        }} />
      </div>
      
      <style>{`
        @keyframes twinkle {
          0% { background-position: 0% 0%; opacity: 0.2; }
          100% { background-position: 100% 100%; opacity: 0.3; }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-7 border border-white/20">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Logo variant="auth" />
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
              <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-md focus:shadow-purple-200/50 transition-all text-slate-900 placeholder-slate-400 bg-white text-sm"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-md focus:shadow-purple-200/50 transition-all text-slate-900 placeholder-slate-400 bg-white text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    calculatePasswordStrength(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-md focus:shadow-purple-200/50 transition-all text-slate-900 placeholder-slate-400 bg-white text-sm"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="h-4 w-4 rounded-full border border-slate-400 flex items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-bold">i</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">Password Strength</span>
                  <span className={`text-xs font-medium text-slate-500`}>
                    {passwordStrength === 'weak' ? 'Weak' :
                     passwordStrength === 'medium' ? 'Medium' :
                     passwordStrength === 'strong' ? 'Strong' : 'Weak'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mb-1">
                  <div 
                    className={`h-1 rounded-full transition-all bg-slate-400 ${
                      passwordStrength === 'weak' ? 'w-1/4' :
                      passwordStrength === 'medium' ? 'w-1/2' :
                      passwordStrength === 'strong' ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-500">Minimum 8 characters</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              By signing up, you agree to the{' '}
              <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

