'use client';

import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/auseAuth';

export default function LogOut() {
    const { user } = useAuth(); // Acessa o usuário autenticado
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/'); // Redireciona para a página inicial após o logout
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    return (
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-1xl font-bold text-black">
                Bem-vindo, {user?.email}!
            </h1>
            <button
                onClick={handleLogout}
                className="ml-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-150"
            >
                Sair
            </button>
        </div>
    );
}
