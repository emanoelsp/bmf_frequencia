import Link from 'next/link';
import { HomeIcon, BookOpenIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/solid'; // Importar os ícones

export default function Nav() {
  return (
    <nav className="flex gap-5 bg-transparent p-2">
      <Link href="/inicio" className="flex flex-col items-center hover:scale-110 rounded-full border-2 border-white md:border-0 md:rounded transition-transform duration-200 md:hover:shadow p-2">
        <HomeIcon className="h-5 w-5 text-white md:h-6 md:w-6" /> {/* Ícone de Início */}
        <span className="text-sm text-white text-center hidden md:block">Início</span> {/* Texto visível em telas maiores */}
      </Link>
      <Link href="/disciplinas" className="flex flex-col items-center hover:scale-110 rounded-full border-2 border-white md:border-0 md:rounded transition-transform duration-200 md:hover:shadow p-2">
        <BookOpenIcon className="h-5 w-5 text-white md:h-6 md:w-6" /> {/* Ícone de Gerenciamento de Turmas */}
        <span className="text-sm text-white text-center hidden md:block">
          Gerenciamento de<br />Disciplinas
        </span>
      </Link>
      <Link href="/turmas" className="flex flex-col items-center hover:scale-110 rounded-full border-2 border-white md:border-0 md:rounded transition-transform duration-200 md:hover:shadow p-2">
        <AcademicCapIcon className="h-5 w-5 text-white md:h-6 md:w-6" /> {/* Ícone de Gerenciamento de Turmas */}
        <span className="text-sm text-white text-center hidden md:block">
          Gerenciamento de<br />Turmas
        </span>
      </Link>
      <Link href="/frequencia" className="flex flex-col items-center hover:scale-110 rounded-full border-2 border-white md:border-0 md:rounded transition-transform duration-200 md:hover:shadow p-2">
        <ClockIcon className="h-5 w-5 text-white md:h-6 md:w-6" /> {/* Ícone de Gerenciamento de Frequência */}
        <span className="text-sm text-white text-center hidden md:block">
          Gerenciamento de<br />Frequência
        </span>
      </Link>
    </nav>
  );
}
