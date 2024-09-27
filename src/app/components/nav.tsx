import Link from 'next/link'

export default function Nav(){
    return (
        <nav className="flex gap-5">
            <Link href="/inicio" className="hover:underline">
              Inicio
            </Link>
            <Link href="/turmas" className="hover:underline">
              Gerenciamento de turmas
            </Link>
            <Link href="/frequencia" className="hover:underline">
              Gerenciamento de frequência
            </Link>
          </nav>
    )
}