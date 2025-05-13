let model;

// Inicializa com número aleatório
window.addEventListener("DOMContentLoaded", () => {
    let number = Math.floor(Math.random() * 10);
    document.getElementById("numberRandom").textContent = number;
    document.getElementById('uploadForm').addEventListener('submit', submitImage);
});

// Carrega o modelo
window.onload = async () => {
    try {
        model = await tf.loadLayersModel('./mnist-model.json');
        console.log("Modelo carregado com sucesso");
    } catch (error) {
        console.error("Erro ao carregar o modelo:", error);
        alert("Erro ao carregar o modelo. Por favor, verifique o console.");
    }
};

// Processa a imagem enviada
async function submitImage(event) {
    event.preventDefault();

    const fileInput = document.getElementById("imageUpload");
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.className = "result";
    resultadoDiv.textContent = "Processando imagem...";

    const file = fileInput.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = function(e) {
        img.src = e.target.result;
    };

    img.onload = async function() {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 28;
            canvas.height = 28;
            const ctx = canvas.getContext("2d");

            // Redimensiona mantendo proporção
            const ratio = Math.min(28 / img.width, 28 / img.height);
            const newWidth = img.width * ratio;
            const newHeight = img.height * ratio;
            const offsetX = (28 - newWidth) / 2;
            const offsetY = (28 - newHeight) / 2;

            // Desenha imagem centralizada
            ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

            // Tensor normalizado 28x28x1
            const tensor = tf.browser.fromPixels(canvas, 1)
                .toFloat()
                .div(255.0)
                .expandDims(0);

            // Predição
            const prediction = model.predict(tensor);
            const predictedValue = prediction.argMax(1).dataSync()[0];
            const confidence = prediction.max().dataSync()[0];
            const expected = parseInt(document.getElementById("numberRandom").textContent);

            // Avaliação personalizada
            resultadoDiv.className = "result"; // reset className

            if (predictedValue === expected) {
                if (confidence >= 0.8) {
                    resultadoDiv.textContent = `✅ Super Caprichado! Uau! Seu número está lindo, você desenha muito bem! (${(confidence * 100).toFixed(1)}%)`;
                    resultadoDiv.classList.add("bom");
                } else if (confidence >= 0.6) {
                    resultadoDiv.textContent = `⚠️ Tá Quase Lá! Muito bom! Com mais um pouquinho de treino, vai ficar perfeito! (${(confidence * 100).toFixed(1)}%)`;
                    resultadoDiv.classList.add("regular");
                } else {
                    resultadoDiv.textContent = `❗Vamos Praticar Juntos! Você está indo bem! Vamos tentar de novo e melhorar juntos! (${(confidence * 100).toFixed(1)}%)`;
                    resultadoDiv.classList.add("ruim");
                }
            } else {
                resultadoDiv.textContent = `❌ Esperado: ${expected} | Predito: ${predictedValue} (${(confidence * 100).toFixed(1)}% confiança)`;
                resultadoDiv.classList.add("ruim");
            }

            document.getElementById("resetButton").style.display = "inline-block";

            tensor.dispose();
            prediction.dispose();

        } catch (error) {
            console.error("Erro:", error);
            resultadoDiv.textContent = "❌ Erro no processamento";
            resultadoDiv.className = "result ruim";
        }
    };

    reader.readAsDataURL(file);
}


// Função para reiniciar o jogo
function resetGame() {
    let number = Math.floor(Math.random() * 10);
    document.getElementById("numberRandom").textContent = number;
    document.getElementById("resultado").textContent = "";
    document.getElementById("resetButton").style.display = "none";
}
