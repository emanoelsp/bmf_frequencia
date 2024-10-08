"use client";

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, addDoc, getDocs, FirestoreError } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';

interface Turma {
  id: string;
  nomeEscola: string;
  anoTurma: string;
  codigoTurma: string;
}

const generateCodigoTurma = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function Cadastro() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [nomeEscola, setNomeEscola] = useState('');
  const [anoTurma, setAnoTurma] = useState('');
  const [nomeCompletoAluno, setNomeCompletoAluno] = useState('');
  const [anoAluno, setAnoAluno] = useState<string>(''); // Mantido como string
  const [turmaId, setTurmaId] = useState<string>('');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const turmaCollectionRef = collection(firestore, 'turmas');
  const alunoCollectionRef = collection(firestore, 'alunos');

  const fetchTurmas = useCallback(async () => {
    const querySnapshot = await getDocs(turmaCollectionRef);
    const turmasData: Turma[] = [];
    querySnapshot.forEach(doc => {
      turmasData.push({ id: doc.id, ...doc.data() } as Turma);
    });
    setTurmas(turmasData);
  }, [turmaCollectionRef]);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Dismiss after 3 seconds
  };

  const handleSubmitTurma = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nomeEscola || !anoTurma) {
      showNotification('Por favor, preencha todos os campos da turma!', 'error');
      return;
    }

    const codigo = generateCodigoTurma();
    try {
      await addDoc(turmaCollectionRef, { nomeEscola, anoTurma, codigoTurma: codigo });
      setNomeEscola('');
      setAnoTurma('');
      showNotification('Turma adicionada com sucesso!', 'success');
      fetchTurmas();
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        console.error('Erro ao adicionar turma: ', error);
        showNotification('Erro ao adicionar turma: ' + error.message, 'error');
      } else {
        console.error('Erro inesperado: ', error);
        showNotification('Erro inesperado!', 'error');
      }
    }
  };

  const handleSubmitAluno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nomeCompletoAluno || !anoAluno || !turmaId) {
      showNotification('Por favor, preencha todos os campos do aluno!', 'error');
      return;
    }

    const turmaSelecionada = turmas.find(turma => turma.id === turmaId);
    
    if (!turmaSelecionada) {
      showNotification('Turma não encontrada!', 'error');
      return;
    }

    const aluno = {
      nome: nomeCompletoAluno,
      anoCursando: anoAluno, // O ano que o aluno está cursando
      turmaId,
      nomeTurma: turmaSelecionada.nomeEscola,
      codigoTurma: turmaSelecionada.codigoTurma,
    };
  
    try {
      await addDoc(alunoCollectionRef, aluno);
      // Limpa apenas o nome do aluno após o cadastro
      setNomeCompletoAluno('');
      showNotification('Aluno adicionado com sucesso!', 'success');
      // Não limpar turmaId para manter a turma selecionada
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        console.error('Erro ao adicionar aluno: ', error);
        showNotification('Erro ao adicionar aluno: ' + error.message, 'error');
      } else {
        console.error('Erro inesperado: ', error);
        showNotification('Erro inesperado!', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2"> Cadastro de Turma e Alunos</h1>

      {notification && (
        <div className={`fixed top-5 right-5 p-3 rounded text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white border-8 p-4 rounded-lg shadow-lg mb-8">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Cadastro de turmas</h2>
        <hr className='border-4' />

        <h4 className="mt-2 text-1xl font-semibold text-gray-700 mb-4">Preencha os dados da escola abaixo:</h4>
        <form onSubmit={handleSubmitTurma} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="nomeEscola" className="block text-gray-600 mb-2">Nome da Escola</label>
              <input
                type="text"
                id="nomeEscola"
                value={nomeEscola}
                onChange={(e) => setNomeEscola(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome da escola"
              />
            </div>
            <div>
              <label htmlFor="anoTurma" className="block text-gray-600 mb-2">Ano da Turma</label>
              <input
                type="text"
                id="anoTurma"
                value={anoTurma}
                onChange={(e) => setAnoTurma(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o ano da turma"
              />
            </div>
          </div>
          <div className="mt-1">
            <button className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150">
              Adicionar Turma
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border-8 p-4 rounded-lg shadow-lg mx-auto">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Cadastro de Alunos</h2>
        <hr className='border-4' />

        <h4 className="mt-2 text-1xl font-semibold text-gray-700 mb-4">Preencha os dados dos alunos abaixo:</h4>

        <form onSubmit={handleSubmitAluno}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="mb-4">
              <label htmlFor="nomeCompletoAluno" className="block text-gray-600 mb-2">Nome Completo</label>
              <input
                type="text"
                id="nomeCompletoAluno"
                value={nomeCompletoAluno}
                onChange={(e) => setNomeCompletoAluno(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome completo do aluno"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="anoAluno" className="block text-gray-600 mb-2">Ano que está cursando</label>
              <input
                type="text"
                id="anoAluno"
                value={anoAluno}
                onChange={(e) => setAnoAluno(e.target.value)} // Mantido como string
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o ano que o aluno está cursando"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="turmaSelect" className="block text-gray-600 mb-2">Selecione a Turma</label>
              <select
                id="turmaSelect"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nomeEscola} - {turma.anoTurma} (Código: {turma.codigoTurma})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150">
              Adicionar Aluno
            </button>
          </div>
        </form>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
}
