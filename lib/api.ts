import axios from 'axios';

// Weather API client
const weatherApi = axios.create({
  baseURL: 'https://api.open-meteo.com/v1/forecast',
});

// Your backend API client (for location management)
const backendApi = axios.create({
  baseURL: '/api',
});

export const fetchWeather = async (lat: number, lon: number) => {
  const response = await weatherApi.get('', {
    params: {
      latitude: lat,
      longitude: lon,
      daily: ['temperature_2m_max', 'temperature_2m_min', 'weathercode', 'windspeed_10m_max', 'precipitation_sum', 'uv_index_max'],
      timezone: 'auto',
    },
  });
  return response.data;
};

export const addLocation = async (locationData: { name: string }) => {
  try {
    const response = await backendApi.post('/locations', locationData);
    return response.data;
  } catch (error) {
    console.error('Error adding location:', error);
    // For demo purposes, create a mock response if the API fails
    return {
      id: `loc-${Date.now()}`,
      name: locationData.name,
      createdAt: new Date().toISOString()
    };
  }
};

export const getLocations = async () => {
  try {
    const response = await backendApi.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    // Return empty array if API fails
    return [];
  }
};