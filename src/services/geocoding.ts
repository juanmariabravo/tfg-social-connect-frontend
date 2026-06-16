import api from './api';

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const { data } = await api.get(`/profiles/reverse-geocode?lat=${lat}&lng=${lng}`);
    return data.address;
  } catch (error: any) {
    const message =
      error.response?.data?.error || 'Error al conectar con el servicio de geocodificación';
    throw new Error(message);
  }
};

export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada por su navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Error al obtener la ubicación' + (error.message ? `: ${error.message}` : '');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso denegado. Por favor, habilite la geolocalización en su navegador';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'La información de ubicación no está disponible';
            break;
          case error.TIMEOUT:
            message = 'Se agotó el tiempo de espera para obtener la ubicación';
            break;
        }
        if ('User denied Geolocation' === error.message) {
          message =
            'Permiso denegado. Por favor, habilite la geolocalización en su navegador o desactive el bloqueador de anuncios';
        }
        reject(new Error(message));
      }
    );
  });
};
