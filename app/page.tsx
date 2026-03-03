'use client';

import * as React from 'react';
import BiotecApp from '@/components/BiotecApp';
import LoginPage from '@/components/LoginPage';

export default function Page() {
  const [user, setUser] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('biotec_user');
    if (savedUser) {
      setUser(savedUser);
    }
    setIsInitialized(true);
  }, []);

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('biotec_user', email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('biotec_user');
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00a859] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <BiotecApp user={user} onLogout={handleLogout} />;
}
