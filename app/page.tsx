'use client';

import * as React from 'react';
import BiotecApp from '@/components/BiotecApp';
import LoginPage from '@/components/LoginPage';

export default function Page() {
  const [user, setUser] = React.useState<string | null>(null);

  if (!user) {
    return <LoginPage onLogin={(email) => setUser(email)} />;
  }

  return <BiotecApp user={user} onLogout={() => setUser(null)} />;
}
