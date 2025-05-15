import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

const DigitRecognizer: React.FC = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel("/mnist-model.json");
        setModel(loadedModel);
        console.log("Modelo carregado");
      } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        alert("Erro ao carregar modelo. Verifique o console.");
      }
    };

    loadModel();
    gerarNovoNumero();
  }, []);

  const gerarNovoNumero = () => {
    const number = Math.floor(Math.random() * 10);
    setRandomNumber(number);
    setResult("");
    if (fileInputRef.current) fileInputRef.current.value = ""; // limpa input
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !model) return;

    try {
      const img = await carregarImagem(file);
      const tensor = processarImagem(img);
      const prediction = model.predict(tensor) as tf.Tensor;
      const predictedValue = prediction.argMax(1).dataSync()[0];
      const confidence = prediction.max().dataSync()[0];
      avaliarResultado(predictedValue, confidence);
      tensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error("Erro no processamento:", error);
      setResult("❌ Erro no processamento");
    }
  };

  const carregarImagem = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => resolve(img);
      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processarImagem = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext("2d")!;
    const ratio = Math.min(28 / img.width, 28 / img.height);
    const newWidth = img.width * ratio;
    const newHeight = img.height * ratio;
    const offsetX = (28 - newWidth) / 2;
    const offsetY = (28 - newHeight) / 2;

    ctx.clearRect(0, 0, 28, 28);
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

    return tf.browser.fromPixels(canvas, 1)
      .toFloat()
      .div(255.0)
      .expandDims(0);
  };

  const avaliarResultado = (predictedValue: number, confidence: number) => {
    if (predictedValue === randomNumber) {
      if (confidence >= 0.8) {
        setResult(`✅ Super Caprichado! Uau! Seu número está lindo! (${(confidence * 100).toFixed(1)}%)`);
      } else if (confidence >= 0.6) {
        setResult(`⚠️ Tá Quase Lá! Muito bom! (${(confidence * 100).toFixed(1)}%)`);
      } else {
        setResult(`❗Vamos Praticar Juntos! Está indo bem! (${(confidence * 100).toFixed(1)}%)`);
      }
    } else {
      setResult(`❌ Esperado: ${randomNumber} | Predito: ${predictedValue} (${(confidence * 100).toFixed(1)}%)`);
    }
  };

  return (
    <section className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4">
        Desenhe o número: <span className="text-purple-600">{randomNumber}</span>
      </h2>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="border border-gray-300 rounded p-2 w-full"
          required
        />
        <button
          type="submit"
          className="bg-pink-400 text-white py-2 px-6 rounded hover:bg-pink-600 transition"
        >
          Enviar
        </button>
      </form>
      <p className="text-lg min-h-[48px]">{result}</p>
      <button
        onClick={gerarNovoNumero}
        className="mt-4 bg-yellow-400 text-purple-800 py-2 px-6 rounded hover:bg-yellow-500 transition"
      >
        🔁 Novo Número
      </button>
    </section>
  );
};

export default DigitRecognizer;
