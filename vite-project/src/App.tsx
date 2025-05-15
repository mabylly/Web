import React from 'react';
import DigitRecognizer from './components/DigitRecognizer';
import Img123 from './assets/123.jpg';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#0b1437] text-white p-0">
      {/* Header */}
      <header className="flex items-center justify-center gap-5 mb-10">
        <img src={Img123} alt="123_Image" className="w-64" />
        <h1 className="text-[48px] text-pink-400 m-0 leading-tight">
          Caligrafia Divertida: <br />
          Escreva e Descubra!
        </h1>
      </header>

      {/* Conteúdo principal */}
      <section className="bg-white text-[#333] p-8 rounded-xl shadow-lg max-w-lg w-[90%] text-center">
        <h2 className="text-2xl font-semibold mb-2 text-black">
          Teste sua caligrafia
        </h2>
        <p className="mb-6 text-black">
          Pegue papel e lápis, desenhe o número que pedirmos e envie uma foto. Vamos avaliar sua
          caligrafia e dizer se está ótima, regular ou precisa melhorar!
        </p>

        <DigitRecognizer />
      </section>
    </div>
  );
};

export default App;
