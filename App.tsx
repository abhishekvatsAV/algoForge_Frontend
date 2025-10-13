import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import PlaygroundPage from './pages/PlaygroundPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';

const AppContent: React.FC = () => {
    const location = useLocation();
    const isPlayground = location.pathname.startsWith('/playground');
    const { isLoginModalOpen, closeLoginModal } = useAuth();

    return (
        <div className="flex flex-col min-h-screen text-light-text-primary dark:text-dark-text-primary bg-light-bg dark:bg-dark-bg">
            <Header />
            <main className="flex-1 overflow-hidden">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/playground" element={<PlaygroundPage />} />
                    <Route path="/playground/:id" element={<PlaygroundPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </main>
            {!isPlayground && <Footer />}
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
        </div>
    );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;