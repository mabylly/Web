// src/App.tsx
import React from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import Whiteboard from './components/whiteboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-200 to-blue-500 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-xl">
            <FaPencilAlt className="text-yellow-500" />
            HandLetter
          </div>

        </div>
        <div className="text-center text-gray-600 mt-10">
          <h1 className="text-3xl font-bold mb-2">Random Word</h1>
          <div className="flex justify-center mt-4">
            <div className="px-4 py-2 bg-blue-100 rounded-full border border-blue-300">
              <p className="text-xl text-blue-800 font-medium">Handwriting Practice</p>
            </div>
          </div>
        </div>
        <Whiteboard />
      </div>
    </div>
  );
};

export default App;
