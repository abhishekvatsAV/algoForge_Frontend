import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import LogoIcon from './icons/LogoIcon';
import Button from './Button';

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);


const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user, logout, openLoginModal } = useAuth();

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `text-sm font-medium px-16 py-8 transition-colors ${
            isActive
                ? 'text-light-accent dark:text-dark-accent'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
        }`;

    return (
        <header className="sticky top-0 z-50 h-64 w-full border-b border-light-border dark:border-dark-border bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm">
            <div className="max-w-[1440px] mx-auto px-24 flex items-center justify-between h-full">
                <div className="flex items-center gap-32">
                    <NavLink to="/" className="flex items-center gap-8 text-light-accent dark:text-dark-accent">
                        <LogoIcon />
                        <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">AlgoForge</span>
                    </NavLink>
                    <nav className="hidden md:flex items-center">
                        <NavLink to="/playground" className={navLinkClass}>Playground</NavLink>
                        <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                    </nav>
                </div>
                <div className="flex items-center gap-16">
                    <button onClick={toggleTheme} className="p-8 rounded-md hover:bg-light-surface-2 dark:hover:bg-dark-surface-2 transition-colors">
                        {theme === 'light' ? <MoonIcon className="w-24 h-24" /> : <SunIcon className="w-24 h-24" />}
                    </button>
                    {isAuthenticated && user ? (
                        <div className="flex items-center gap-16">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary hidden sm:block">{user.email}</span>
                            <Button variant="secondary" size="sm" onClick={logout}>Logout</Button>
                        </div>
                    ) : (
                         <Button size="sm" onClick={openLoginModal}>
                            Login / Sign Up
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;