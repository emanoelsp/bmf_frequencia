"use client"; // Adicione esta linha

import { useAuth } from '../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth'; // Importa a função de logout
import { auth } from '../lib/firebaseConfig'; // Importa a configuração do Firebase
import LogOut from '../components/logout';

export default function Frequencia() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <p>Loading...</p>; // Exibir um carregamento

  if (!user) {
    router.push('/login'); // Redirecionar para a página de login se não estiver autenticado
    return null;
  }

  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Realiza o logout
      router.push('/login'); // Redireciona para a página de login
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
            <LogOut />

      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Gerenciamento de frequência</h1>

      {/* Seção de Botões */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Botão Cadastrar Frequência */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cadastrar frequência de Alunos</h2>
          <Link href="/frequencia/cadastro">
            <button
              className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150"
            >
              Cadastrar frequência de Alunos
            </button>
          </Link>
        </div>

        {/* Botão Relatórios de Frequência */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Relatórios de frequência de Alunos</h2>
          <Link href="/frequencia/relatorio">
            <button
              className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-800 focus:outline-none focus:bg-green-800 transition duration-150"
            >
              Relatórios de frequência de Alunos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
