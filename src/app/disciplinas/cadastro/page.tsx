"use client";

import { useState, FormEvent } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';

export default function CadastroDisciplina() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [nomeDisciplina, setNomeDisciplina] = useState('');
  const [nomeProfessor, setNomeProfessor] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const disciplinaCollectionRef = collection(firestore, 'disciplinas');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nomeDisciplina || !nomeProfessor) {
      showNotification('Por favor, preencha todos os campos!', 'error');
      return;
    }

    try {
      await addDoc(disciplinaCollectionRef, { nomeDisciplina, nomeProfessor });
      setNomeDisciplina('');
      setNomeProfessor('');
      showNotification('Disciplina e professor adicionados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar disciplina e professor: ', error);
      showNotification('Erro ao adicionar disciplina e professor!', 'error');
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2">Cadastro de Disciplina e Professor</h1>

      {notification && (
        <div className={`fixed top-5 right-5 p-3 rounded text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white border-8 p-4 rounded-lg shadow-lg mb-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Preencha os dados abaixo:</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nomeDisciplina" className="block text-gray-600 mb-2">Nome da Disciplina</label>
            <input
              type="text"
              id="nomeDisciplina"
              value={nomeDisciplina}
              onChange={(e) => setNomeDisciplina(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome da disciplina"
            />
          </div>
          <div>
            <label htmlFor="nomeProfessor" className="block text-gray-600 mb-2">Nome do Professor</label>
            <input
              type="text"
              id="nomeProfessor"
              value={nomeProfessor}
              onChange={(e) => setNomeProfessor(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome do professor"
            />
          </div>
          <div className="mt-6">
            <button type="submit" className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150">
              Adicionar Disciplina e Professor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

