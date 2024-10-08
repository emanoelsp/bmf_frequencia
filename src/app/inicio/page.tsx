"use client"; // Adicione esta linha

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/auseAuth'; // Corrigi o caminho do hook de autenticação
import { useRouter } from 'next/navigation';
import { firestore } from '../lib/firebaseConfig'; // Importa a configuração do Firebase
import { collection, getDocs } from 'firebase/firestore'; // Importa as funções necessárias do Firestore
import LogOut from '../components/logout';

// Definindo a interface Aluno
interface Aluno {
  id: string;
  presenca: 'V' | 'F'; // 'V' para presença e 'F' para falta
}

export default function Inicio() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [totalAlunos, setTotalAlunos] = useState<number>(0);
  const [totalTurmas, setTotalTurmas] = useState<number>(0);
  const [mediaFrequencia, setMediaFrequencia] = useState<number>(0);
  const [alunosCom100Porcento, setAlunosCom100Porcento] = useState<number>(0);
  const [alunosComFrequenciaBaixa, setAlunosComFrequenciaBaixa] = useState<number>(0);
  const [totalDiasLetivos, setTotalDiasLetivos] = useState<number>(0);

  useEffect(() => {
    const fetchTotalAlunos = async () => {
      const alunosCollectionRef = collection(firestore, 'alunos');
      const alunosDocs = await getDocs(alunosCollectionRef);
      setTotalAlunos(alunosDocs.docs.length);
    };

    const fetchTotalTurmas = async () => {
      const turmasCollectionRef = collection(firestore, 'turmas');
      const turmasDocs = await getDocs(turmasCollectionRef);
      setTotalTurmas(turmasDocs.docs.length);
    };

    const fetchFrequencias = async () => {
      const frequenciasCollectionRef = collection(firestore, 'frequencia_diaria');
      const frequenciasDocs = await getDocs(frequenciasCollectionRef);
      const frequenciasData = frequenciasDocs.docs.map(doc => doc.data());

      if (frequenciasData.length > 0) {
        const totalAlunosNaFrequencia = frequenciasData[0].alunos.length;

        // Calcular a média de frequência
        const totalPresencas = frequenciasData.reduce((acc, frequencia) => {
          const presencas = frequencia.alunos.filter((aluno: Aluno) => aluno.presenca === 'V').length;
          return acc + presencas;
        }, 0);

        const media = totalAlunosNaFrequencia > 0 ? (totalPresencas / (totalAlunosNaFrequencia * frequenciasData.length)) * 100 : 0;
        setMediaFrequencia(media);

        // Calcular alunos com 100% de frequência
        const alunosCom100Porcento = frequenciasData.reduce((count: Record<string, number>, frequencia) => {
          frequencia.alunos.forEach((aluno: Aluno) => {
            if (aluno.presenca === 'V') count[aluno.id] = (count[aluno.id] || 0) + 1;
          });
          return count;
        }, {});

        const totalAlunosCom100 = Object.values(alunosCom100Porcento).filter(count => count === frequenciasData.length).length;
        setAlunosCom100Porcento(totalAlunosCom100);

        // Calcular alunos com frequência abaixo de 75%
        const alunosComFrequenciaBaixa = frequenciasData.reduce((count: Record<string, number>, frequencia) => {
          frequencia.alunos.forEach((aluno: Aluno) => {
            if (aluno.presenca === 'F') count[aluno.id] = (count[aluno.id] || 0) + 1;
          });
          return count;
        }, {});

        const totalAlunosComFrequenciaBaixa = Object.values(alunosComFrequenciaBaixa).filter(count => {
          const frequenciaAluno = (frequenciasData.length - count) / frequenciasData.length * 100;
          return frequenciaAluno < 75;
        }).length;

        setAlunosComFrequenciaBaixa(totalAlunosComFrequenciaBaixa);
        setTotalDiasLetivos(frequenciasData.length);
      }
    };

    fetchTotalAlunos();
    fetchTotalTurmas();
    fetchFrequencias();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) {
    router.push('/login');
    return null;
  }


  return (
    <div className="min-h-screen bg-gray-100 p-0 mb-8 md:mb-0 md:p-2">
      <LogOut />
   
      <h1 className="text-3xl font-bold text-center text-gray-800 mt-2">Estatísticas de Turmas e Frequência</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Total de Alunos</h2>
          <p className="text-5xl font-bold text-blue-500">{totalAlunos}</p>
          <p className="text-gray-500 mt-2">Total de alunos cadastrados</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Total de Turmas</h2>
          <p className="text-5xl font-bold text-purple-500">{totalTurmas}</p>
          <p className="text-gray-500 mt-2">Total de turmas cadastradas</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Frequência Média</h2>
          <p className="text-5xl font-bold text-orange-500">{mediaFrequencia.toFixed(2)}%</p>
          <p className="text-gray-500 mt-2">Média de frequência dos alunos</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Alunos com 100% de Frequência</h2>
          <p className="text-5xl font-bold text-green-500">{alunosCom100Porcento}</p>
          <p className="text-gray-500 mt-2">Alunos com frequência perfeita</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Alunos com Frequência Abaixo de 75%</h2>
          <p className="text-5xl font-bold text-red-500">{alunosComFrequenciaBaixa}</p>
          <p className="text-gray-500 mt-2">Alunos com frequência crítica</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Total de Dias Letivos</h2>
          <p className="text-5xl font-bold text-yellow-500">{totalDiasLetivos}</p>
          <p className="text-gray-500 mt-2">Total de dias com frequência registrada</p>
        </div>
      </div>
    </div>
  );
}
