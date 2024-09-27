import Nav from './nav'


export default function Header(){
    return (
        <header className="container flex justify-between mb-8">
            <div className="text-xl font-bold"> BOTANDO A MÃO E FAZENDO </div>
            <Nav /> 
        </header>
    )
}

