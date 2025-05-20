import axios from 'axios';

// Using OpenCage Geocoding API
const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

interface GeocodeResult {
  lat: number;
  lon: number;
  name: string;
  country?: string;
}

export const geocodeCity = async (cityName: string): Promise<GeocodeResult> => {
  try {
    // Check if API key is available
    if (!OPENCAGE_API_KEY) {
      console.error('OpenCage API key is missing');
      throw new Error('API key is not configured');
    }
    
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: cityName,
        key: OPENCAGE_API_KEY,
        limit: 1,
      },
    });

    if (response.data.results.length === 0) {
      throw new Error('Location not found');
    }

    const result = response.data.results[0];
    const { lat, lng } = result.geometry;
    
    // Get formatted location name
    const formattedName = result.components.city || 
                          result.components.town || 
                          result.components.village || 
                          result.components.county ||
                          cityName;
    
    const country = result.components.country;

    return {
      lat,
      lon: lng,
      name: formattedName,
      country
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode location');
  }
};

// Add this function to get location name from coordinates
export const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    
    const data = await response.json();
    
    // Extract city or town name
    const locationName = data.address.city || 
                         data.address.town || 
                         data.address.village || 
                         data.address.county ||
                         'Unknown Location';
                         
    return {
      name: locationName,
      country: data.address.country
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { name: 'Current Location', country: '' };
  }
};