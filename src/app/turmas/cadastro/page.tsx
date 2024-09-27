"use client"; // Adicione esta linha

import { useState, FormEvent, useEffect } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  anoCursando: number;
  turmaId: string;
  nomeTurma: string; // Novo campo para o nome da turma
  codigoTurma: string; // Novo campo para o código da turma
}

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
  const [nomeAluno, setNomeAluno] = useState('');
  const [sobrenomeAluno, setSobrenomeAluno] = useState('');
  const [anoAluno, setAnoAluno] = useState<number | string>('');
  const [turmaId, setTurmaId] = useState<string>('');
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const turmaCollectionRef = collection(firestore, 'turmas');
  const alunoCollectionRef = collection(firestore, 'alunos');



  const handleSubmitTurma = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const codigo = generateCodigoTurma();
    try {
      await addDoc(turmaCollectionRef, { nomeEscola, anoTurma, codigoTurma: codigo });
      setNomeEscola('');
      setAnoTurma('');
      alert('Turma adicionada com sucesso!');
      fetchTurmas();
    } catch (error) {
      console.error('Erro ao adicionar turma: ', error);
    }
  };

  const handleSubmitAluno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!nomeAluno || !sobrenomeAluno || !anoAluno || !turmaId) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Encontrar a turma selecionada para obter o nome e código
    const turmaSelecionada = turmas.find(turma => turma.id === turmaId);
    
    if (!turmaSelecionada) {
      alert('Turma não encontrada!');
      return;
    }

    const aluno = {
      nome: nomeAluno,
      sobrenome: sobrenomeAluno,
      anoCursando: Number(anoAluno),
      turmaId,
      nomeTurma: turmaSelecionada.nomeEscola, // Adiciona o nome da turma
      codigoTurma: turmaSelecionada.codigoTurma, // Adiciona o código da turma
    };
  
    try {
      await addDoc(alunoCollectionRef, aluno);
      setNomeAluno('');
      setSobrenomeAluno('');
      setAnoAluno('');
      setTurmaId('');
      alert('Aluno adicionado com sucesso!');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erro ao adicionar aluno: ', error.message);
      } else {
        console.error('Erro desconhecido: ', error);
      }
    }
  };

  const fetchTurmas = async () => {
    const querySnapshot = await getDocs(turmaCollectionRef);
    const turmasData: Turma[] = [];
    querySnapshot.forEach(doc => {
      turmasData.push({ id: doc.id, ...doc.data() } as Turma);
    });
    setTurmas(turmasData);
  };

  useEffect(() => {
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Cadastro de Turma e Alunos</h1>

      <div className="bg-white border-8 p-6 rounded-lg shadow-lg mx-auto mb-8">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Cadastro de turmas</h2>
        <h4 className="text-1xl font-semibold text-gray-700 mb-4">Preencha os dados da escola abaixo:</h4>
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
            <div>
              <label className="block text-gray-600 mb-2">Código da Turma</label>
              <input
                type="text"
                value={generateCodigoTurma()}
                readOnly
                className="w-full p-3 border border-gray-300 rounded text-gray-600 bg-gray-200"
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

      <div className="bg-white border-8 p-6 rounded-lg shadow-lg mx-auto">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Cadastro de Alunos</h2>
        <h4 className="text-1xl font-semibold text-gray-700 mb-4">Preencha os dados dos alunos abaixo:</h4>

        <form onSubmit={handleSubmitAluno}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="mb-4">
              <label htmlFor="nomeAluno" className="block text-gray-600 mb-2">Nome</label>
              <input
                type="text"
                id="nomeAluno"
                value={nomeAluno}
                onChange={(e) => setNomeAluno(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome do aluno"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="sobrenomeAluno" className="block text-gray-600 mb-2">Sobrenome</label>
              <input
                type="text"
                id="sobrenomeAluno"
                value={sobrenomeAluno}
                onChange={(e) => setSobrenomeAluno(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o sobrenome do aluno"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="anoAluno" className="block text-gray-600 mb-2">Ano que está cursando</label>
              <input
                type="text"
                id="anoAluno"
                value={anoAluno}
                onChange={(e) => setAnoAluno(Number(e.target.value))}
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
    </div>
  );
}
