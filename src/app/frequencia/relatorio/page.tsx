'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/auseAuth'; 
import { useRouter } from 'next/navigation';
import { firestore } from '../../lib/firebaseConfig'; 
import { collection, getDocs, query, where } from 'firebase/firestore';
import LogOut from '../../components/logout'

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  anoCursando: number;
  frequencias: { [key: string]: boolean }; 
}

interface Turma {
  id: string;
  nomeEscola: string;
  anoTurma: string;
  codigoTurma: string;
}

interface Frequencia {
  data: string;
  presencas: { [key: string]: boolean }; 
}

export default function Relatorios() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);

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
    setAlunos([]); // Limpa alunos ao trocar a turma
    setFrequencias([]); // Limpa frequências

    if (turmaId) {
      const alunosQuery = query(collection(firestore, 'alunos'), where('turmaId', '==', turmaId));
      const alunosSnapshot = await getDocs(alunosQuery);
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        frequencias: {},
      })) as Aluno[];

      setAlunos(alunosData);

      const frequenciasData = await fetchFrequencias(turmaId);
      setFrequencias(frequenciasData);

      // Atualiza as frequências de cada aluno
      const updatedAlunos = alunosData.map(aluno => {
        const alunoFrequencias = frequenciasData.reduce((acc, frequencia) => {
          const chaveAluno = `${aluno.nome} ${aluno.sobrenome}`; // Combina nome e sobrenome
          acc[frequencia.data] = frequencia.presencas[chaveAluno] || false; // Busca a presença
          return acc;
        }, {} as { [key: string]: boolean });
        
        return { ...aluno, frequencias: alunoFrequencias };
      });

      setAlunos(updatedAlunos);
    }
  };

  const fetchFrequencias = async (turmaId: string) => {
    const frequenciaCollectionRef = collection(firestore, 'frequencia_diaria');
    const frequenciaQuery = query(frequenciaCollectionRef, where('turmaId', '==', turmaId));
    const frequenciaDocs = await getDocs(frequenciaQuery);
    
    const frequenciasData = frequenciaDocs.docs.map(doc => {
      const data = doc.data();
      const presencas = data.alunos.reduce((acc: { [key: string]: boolean }, aluno: any) => {
        const chaveAluno = `${aluno.nome} ${aluno.sobrenome}`; // Combina nome e sobrenome
        acc[chaveAluno] = aluno.presenca === 'V'; // Marca presença se "V"
        return acc;
      }, {});
      return {
        data: data.data,
        presencas,
      } as Frequencia;
    });

    return frequenciasData;
  };



  if (loading) return <p>Loading...</p>; 

  return (
    <div className="min-h-screen bg-gray-100 border-8 p-8">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-black mb-8">
        Relatório de Frequência
      </h1>

      <div className="bg-white border-8 p-6 rounded-lg shadow-lg max-w-4xl mx-auto mb-8">
        <h2 className="text-xl font-semibold text-black mb-4">
          Selecionar Turma
        </h2>
        <form>
          <div className="mb-4">
            <label htmlFor="turma" className="block text-black mb-2">
              Turma
            </label>
            <select
              id="turma"
              value={turmaSelecionada}
              onChange={handleTurmaChange}
              className="w-full p-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escolha a turma</option>
              {turmas.map(turma => (
                <option key={turma.id} value={turma.id}>
                  {turma.nomeEscola} - {turma.anoTurma} - {turma.codigoTurma}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto border-8">
        <h2 className="text-xl font-semibold text-black mb-4">
          Relatório de Frequência
        </h2>
        
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 text-left text-black">Nome</th>
              <th className="px-4 py-2 text-left text-black">Sobrenome</th>
              {frequencias.map(f => (
                <th key={f.data} className="px-4 py-2 text-center text-black">{f.data}</th>
              ))}
              <th className="px-4 py-2 text-center text-black">Percentual de Presença</th>
            </tr>
          </thead>
          <tbody>
            {alunos.length === 0 ? (
              <tr>
                <td colSpan={frequencias.length + 2} className="text-center text-black">Nenhum aluno encontrado.</td>
              </tr>
            ) : (
              alunos.map((aluno: Aluno) => {
                const totalAulas = frequencias.length;
                const aulasPresentes = frequencias.filter(f => aluno.frequencias[f.data]).length;
                const percentualPresenca = totalAulas > 0 ? (aulasPresentes / totalAulas) * 100 : 0;

                return (
                  <tr key={aluno.id} className="border-t">
                    <td className="px-4 py-2 text-black">{aluno.nome}</td>
                    <td className="px-4 py-2 text-black">{aluno.sobrenome}</td>
                    {frequencias.map(f => (
                      <td key={f.data} className="px-4 py-2 text-center text-black">
                        {aluno.frequencias[f.data] ? 'Presente' : 'Ausente'}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-center text-black">{percentualPresenca.toFixed(2)}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
