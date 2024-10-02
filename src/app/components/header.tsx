import Nav from './nav'


export default function Header(){
    return (
        <header className="w-full flex justify-between p-4">
            <div className="text-xl font-bold"> BOTANDO A MÃO E FAZENDO </div>
            <Nav /> 
        </header>
    )
}

