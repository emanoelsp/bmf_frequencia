"use client"; // Adicione esta linha

import { useAuth } from '../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogOut from '../components/logout';
import { UsersIcon, ChartBarIcon } from '@heroicons/react/24/solid'; // Importe os ícones

export default function Turmas() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <p>Loading...</p>; // Exibir um carregamento

  if (!user) {
    router.push('/login'); // Redirecionar para a página de login se não estiver autenticado
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2"> Gerenciamento de Turmas</h1>

      {/* Seção de Botões */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Botão Cadastrar Turmas */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <UsersIcon className="h-12 w-12 text-blue-500 mb-4" /> {/* Ícone de pessoas */}
          <Link href="/turmas/cadastro">
            <button
              className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-700 focus:outline-none focus:bg-blue-700 transition duration-150"
            >
              Cadastrar Turmas e Alunos
            </button>
          </Link>
        </div>

        {/* Botão Relatórios de Turmas */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <ChartBarIcon className="h-12 w-12 text-green-600 mb-4" /> {/* Ícone de gráfico */}
          <Link href="/turmas/relatorio">
            <button
              className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-800 focus:outline-none focus:bg-green-800 transition duration-150"
            >
              Relatórios de Turmas e Alunos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
