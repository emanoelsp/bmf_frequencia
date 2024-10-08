import Nav from './nav'


export default function Header(){
    return (
        <header className="w-full flex justify-between p-4">
            <div className="mt-7 hidden sm:block text-xl font-bold justify-center"> BOTANDO A MÃO E FAZENDO </div>
            <Nav /> 
        </header>
    )
}

