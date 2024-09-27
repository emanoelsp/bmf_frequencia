// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface User {
  uid: string;
  email: string;
  // Adicione outros campos que você espera no usuário
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ? { uid: user.uid, email: user.email || '' } : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
