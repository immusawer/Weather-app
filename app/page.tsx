"use client";
import { useGeolocation } from '../components/hooks/useGeolocation';
import { fetchWeather } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocode';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { AddLocationDialog } from '@/components/AddLocationDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MapPin, RefreshCw, Compass, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define proper types for weather data and locations
interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
  };
  // Add other properties as needed
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function WeatherPage() {
  const { latitude, longitude, error, isLoading: geoLoading } = useGeolocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<string>("current");
  const [locationWeather, setLocationWeather] = useState<{[key: string]: WeatherData | null}>({});

  useEffect(() => {
    if (error) {
      toast.error(`Geolocation Error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      if (latitude && longitude) {
        try {
          setIsLoading(true);
          
          // Fetch weather data
          const data = await fetchWeather(latitude, longitude);
          
          // Get location name using reverse geocoding
          const locationInfo = await reverseGeocode(latitude, longitude);
          
          // Add location name for current location
          data.location = { 
            name: locationInfo.name, 
            country: locationInfo.country 
          };
          
          setWeatherData(data);
        } catch (error) {
          toast.error('Failed to fetch weather data');
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [latitude, longitude]);

  // Load saved locations on initial render
  useEffect(() => {
    const savedLocations = localStorage.getItem('weatherLocations');
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        setLocations(parsedLocations);
        
        // Pre-fetch weather data for all saved locations
        const fetchAllLocationWeather = async () => {
          const weatherPromises = parsedLocations.map(async (location: Location) => {
            try {
              const data = await fetchWeather(location.latitude, location.longitude);
              data.location = { name: location.name };
              return { locationId: location.id, data };
            } catch (error) {
              console.error(`Failed to fetch weather for ${location.name}`, error);
              return { locationId: location.id, data: null };
            }
          });
          
          const results = await Promise.all(weatherPromises);
          
          // Create a new object with all location weather data
          const newLocationWeather = results.reduce((acc, { locationId, data }) => {
            if (data) {
              acc[locationId] = data;
            }
            return acc;
          }, {} as {[key: string]: WeatherData | null});
          
          setLocationWeather(newLocationWeather);
        };
        
        fetchAllLocationWeather();
      } catch (error) {
        console.error('Failed to parse saved locations', error);
      }
    }
  }, []);
  
  // Save locations whenever they change
  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem('weatherLocations', JSON.stringify(locations));
    }
  }, [locations]);
  
  const handleAddLocation = (newLocation: Location) => {
    // Update locations list
    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    // localStorage will be updated by the effect above
  };

  // Also update the refresh function
  const handleRefresh = async () => {
    const locationId = activeLocation;
    
    if (locationId === "current") {
      if (latitude && longitude) {
        try {
          setIsLoading(true);
          const data = await fetchWeather(latitude, longitude);
          
          // Get location name using reverse geocoding
          const locationInfo = await reverseGeocode(latitude, longitude);
          
          // Add location name for current location
          data.location = { 
            name: locationInfo.name, 
            country: locationInfo.country 
          };
          
          setWeatherData(data);
          toast.success("Weather data refreshed");
        } catch (error) {
          toast.error('Failed to refresh weather data');
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        try {
          setLocationWeather({
            ...locationWeather,
            [locationId]: null // Set to null to show loading state
          });
          const data = await fetchWeather(location.latitude, location.longitude);
          data.location = { name: location.name };
          setLocationWeather({
            ...locationWeather,
            [locationId]: data
          });
          toast.success(`Weather data for ${location.name} refreshed`);
        } catch (error) {
          toast.error(`Failed to refresh weather for ${location.name}`);
          console.error(error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 pb-10">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Weather Forecast</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              aria-label="Refresh weather data"
            >
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </Button>
            <AddLocationDialog onAdd={handleAddLocation} />
          </div>
        </header>

        <Tabs 
          defaultValue="current" 
          value={activeLocation}
          onValueChange={(value) => setActiveLocation(value)}
          className="space-y-6"
        >
          <TabsList className="bg-card border p-1 rounded-full flex-wrap justify-start">
            <TabsTrigger value="current" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Compass className="h-4 w-4 mr-2" />
              Current Location
            </TabsTrigger>
            {locations.map((loc) => (
              <TabsTrigger 
                key={loc.id} 
                value={loc.id} 
                className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {loc.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="current" className="mt-6">
            {geoLoading || isLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : (
              <WeatherDisplay weatherData={weatherData} isLoading={isLoading} />
            )}
          </TabsContent>

          {locations.map((loc) => (
            <TabsContent key={loc.id} value={loc.id} className="mt-6">
              {!locationWeather[loc.id] ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-500" />
                </div>
              ) : (
                <WeatherDisplay weatherData={locationWeather[loc.id]} isLoading={false} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}