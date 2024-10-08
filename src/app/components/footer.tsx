'use client';

import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white p-8 " >
            <div className="text-center">
                <p>&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
                <div className="mt-2">
                    <a href="#" className="text-gray-400 hover:text-gray-300 mx-2">Política de Privacidade</a>
                    <a href="#" className="text-gray-400 hover:text-gray-300 mx-2">Termos de Serviço</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;