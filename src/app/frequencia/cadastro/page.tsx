"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/auseAuth'; 
import { useRouter } from 'next/navigation';
import { firestore } from '../../lib/firebaseConfig'; 
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import LogOut from '@/app/components/logout';

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  anoCursando: number;
  turmaId: string; // Adicionei a turmaId para referenciar a turma
}

interface Turma {
  id: string;
  nomeEscola: string;
  anoTurma: string;
  codigoTurma: string;
}

export default function RelatorioTurmasFrequencia() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [presenca, setPresenca] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }

    const fetchTurmas = async () => {
      const turmaCollectionRef = collection(firestore, 'turmas');
      const turmaDocs = await getDocs(turmaCollectionRef);
      const turmasData = turmaDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Turma[];
      setTurmas(turmasData);
    };

    fetchTurmas();
  }, [loading, user, router]);

  const handleTurmaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turmaId = e.target.value;
    setTurmaSelecionada(turmaId);
    setPresenca({}); 

    if (turmaId) {
      const alunosQuery = query(collection(firestore, 'alunos'), where('turmaId', '==', turmaId));
      const alunosSnapshot = await getDocs(alunosQuery);
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Aluno[];
      setAlunos(alunosData);
    } else {
      setAlunos([]);
    }
  };

  const handleSalvarFrequencia = async () => {
    if (!data || !turmaSelecionada) {
      alert('Por favor, preencha a data e selecione uma turma.');
      return;
    }

    const frequenciaData = {
      turmaId: turmaSelecionada,
      data,
      alunos: alunos.map(aluno => ({
        nome: aluno.nome,
        sobrenome: aluno.sobrenome,
        turma: aluno.turmaId,
        presenca: presenca[aluno.id] ? 'V' : 'F',
      })),
    };

    try {
      await addDoc(collection(firestore, 'frequencia_diaria'), frequenciaData);
      alert('Frequência salva com sucesso!');
      setPresenca({});
      setData('');
      setTurmaSelecionada('');
      setAlunos([]);
    } catch (error) {
      console.error('Erro ao salvar a frequência: ', error);
      alert('Erro ao salvar a frequência.');
    }
  };



  const handleCheckboxChange = (id: string) => {
    setPresenca(prev => ({
      ...prev,
      [id]: !prev[id], 
    }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-black mb-8">Cadastrar frequência dos alunos</h1>

      <div className="bg-white border-8 p-6 rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-black mb-4">Selecione a turma:</h1>
          <select
            id="turma"
            value={turmaSelecionada}
            onChange={handleTurmaChange}
            className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma turma</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id} className="text-black">
                {turma.nomeEscola} - {turma.anoTurma} - {turma.codigoTurma}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">Informe a data:</h2>
          <input
            type="date"
            id="data"
            className="w-full p-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        <h2 className="text-xl font-semibold text-black mb-4">Lista de Alunos Cadastrados:</h2>
        <table className="w-full border-t border-b">
          <thead>
            <tr>
              <th className="text-left text-black py-2">Nome do Aluno</th>
              <th className="text-left text-black py-2">Ano que está cursando</th>
              <th className="text-left text-black py-2">Presença</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, index) => (
              <tr key={aluno.id} className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}>
                <td className="py-2 text-black">{aluno.nome} {aluno.sobrenome}</td>
                <td className="py-2 text-black">{aluno.anoCursando}</td>
                <td className="py-2">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6" 
                    checked={presenca[aluno.id] || false} 
                    onChange={() => handleCheckboxChange(aluno.id)} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-6 text-center">
          <button
            className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600 transition duration-150"
            onClick={handleSalvarFrequencia}
          >
            Salvar Frequência
          </button>
        </div>
      </div>
    </div>
  );
}
