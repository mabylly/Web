// App.jsx
import { useEffect } from 'react';
import './App.css'; // Estilos, se quiser

function App() {
  function resetGame() {
    // Implemente ou copie da sua lógica do script.js
    console.log("Resetando jogo...");
  }

  useEffect(() => {
    // Aqui você pode importar lógicas JS (ex: gerar número aleatório)
    // ou interações que estavam no script.js
  }, []);

  return (
    <>
      <div id="div-header">
        <img src="assets/123.jpg" alt="123_Image" width="256px" />
        <h1>
          Caligrafia Divertida: <br />
          Escreva e Descubra!
        </h1>
      </div>

      <section className="conteudo-branco">
        <h2>Teste sua caligrafia</h2>
        <p className="description">
          Pegue papel e lápis, desenhe o número que pedirmos e envie uma foto. Vamos avaliar sua
          caligrafia e dizer se está ótima, regular ou precisa melhorar!
        </p>

        <div className="numbers">
          <p id="numberRandom">5</p> {/* Isso pode virar um estado depois */}
        </div>

        <form id="uploadForm">
          <input type="file" id="imageUpload" accept="image/*" capture="camera" required />
          <br />
          <button type="submit">Enviar</button>
        </form>

        <div className="result" id="resultado"></div>

        <button id="resetButton" style={{ display: 'none' }} onClick={resetGame}>
          Tentar Novamente
        </button>
      </section>
    </>
  );
}

export default App;
