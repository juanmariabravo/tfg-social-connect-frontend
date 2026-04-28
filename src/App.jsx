import React from 'react';
import StatusChecker from './components/StatusChecker';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-8">Social Connect</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Estado del Sistema</h2>
        <StatusChecker />
      </div>
    </div>
  )
}

export default App
