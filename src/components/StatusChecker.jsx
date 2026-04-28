import React, { useState, useEffect } from 'react';
import api from '../services/api';

const StatusChecker = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Hacemos la petición a la ruta que configuramos en el backend
        const response = await api.get('/status');
        setStatus(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return <p className="text-gray-500 animate-pulse">Comprobando conexión con el backend...</p>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-md">
        <p className="font-bold">Error de conexión</p>
        <p className="text-sm text-red-500">¿Está encendido el servidor del backend? ({error})</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <p className="text-green-700 font-bold mb-2">¡Conectado exitosamente!</p>
      <pre className="bg-green-100 p-2 rounded text-xs text-green-800 overflow-auto">
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  );
};

export default StatusChecker;
