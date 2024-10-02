"use client"; // Adicione esta linha

import { useAuth } from '../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogOut from '../components/logout';
import { ClipboardIcon, DocumentChartBarIcon } from '@heroicons/react/24/solid'; // Importe os ícones

export default function Frequencia() {
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
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Gerenciamento de Frequência</h1>

      {/* Seção de Botões */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Botão Cadastrar Frequência */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <ClipboardIcon className="h-12 w-12 text-blue-500 mb-4" /> {/* Ícone de Cadastro */}
          <Link href="/frequencia/cadastro">
            <button
              className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150"
            >
              Cadastrar Frequência de Alunos
            </button>
          </Link>
        </div>

        {/* Botão Relatórios de Frequência */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <DocumentChartBarIcon className="h-12 w-12 text-green-600 mb-4" /> {/* Ícone de Relatórios */}
          <Link href="/frequencia/relatorio">
            <button
              className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-800 focus:outline-none focus:bg-green-800 transition duration-150"
            >
              Relatórios de Frequência de Alunos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
