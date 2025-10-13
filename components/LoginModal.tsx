import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import LogoIcon from './icons/LogoIcon';
import GoogleIcon from './icons/GoogleIcon';
import GithubIcon from './icons/GithubIcon';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);

const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, guestLogin } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (view === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/playground');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await guestLogin();
      navigate('/playground');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (newView: 'login' | 'signup') => {
      setView(newView);
      setError(null);
      setEmail('');
      setPassword('');
  }
  
  const tabButtonClasses = (tabView: 'login' | 'signup') => 
    `w-full p-8 text-sm font-semibold transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 dark:focus:ring-offset-dark-surface ${
      view === tabView 
      ? 'bg-light-surface-2 dark:bg-dark-surface-2 text-light-text-primary dark:text-dark-text-primary' 
      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-2/50 dark:hover:bg-dark-surface-2/50'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-light-surface dark:bg-dark-surface rounded-md shadow-soft dark:shadow-soft-dark w-full max-w-sm p-24 m-16 relative transform transition-transform duration-300 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-16 right-16 p-4 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-2 dark:hover:bg-dark-surface-2"
          aria-label="Close login modal"
        >
          <CloseIcon className="w-16 h-16" />
        </button>

        <div className="flex flex-col items-center text-center mb-24">
            <LogoIcon className="w-32 h-32 text-light-accent dark:text-dark-accent mb-8" />
            <h2 className="text-xl font-bold">Welcome to AlgoForge</h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-4">
                Sign in or create an account to continue
            </p>
        </div>

        <div className="p-4 mb-16 bg-light-surface-2 dark:bg-dark-surface-2 rounded-md flex gap-4">
            <button onClick={() => switchView('login')} className={tabButtonClasses('login')}>Log In</button>
            <button onClick={() => switchView('signup')} className={tabButtonClasses('signup')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-16">
          {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-8 rounded-md text-left">{error}</p>}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full p-8 bg-light-surface-2 dark:bg-dark-surface-2 border border-light-border dark:border-dark-border rounded-md focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password"className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full p-8 bg-light-surface-2 dark:bg-dark-surface-2 border border-light-border dark:border-dark-border rounded-md focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none text-sm"
              placeholder="Password"
            />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : (view === 'login' ? 'Continue with Email' : 'Create Account')}
          </Button>
        </form>
        
        <div className="relative my-24">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-border dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs">
                <span className="px-8 bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary">OR</span>
            </div>
        </div>

        <div className="space-y-8">
            <Button variant="secondary" size="sm" className="w-full gap-8" disabled>
                <GoogleIcon className="w-16 h-16"/>
                Continue with Google
            </Button>
             <Button variant="secondary" size="sm" className="w-full gap-8" disabled>
                <GithubIcon className="w-16 h-16" />
                Continue with GitHub
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={handleGuestLogin} disabled={isLoading}>
                Continue as Guest
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
