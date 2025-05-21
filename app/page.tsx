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
import { MapPin, RefreshCw, Compass, Globe, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-grow">
        <Card className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm mb-8">
          <header className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-full">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Weather Forecast
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
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

          <div className="p-6">
            <Tabs 
              defaultValue="current" 
              value={activeLocation}
              onValueChange={(value) => setActiveLocation(value)}
              className="space-y-6"
            >
              <div className="overflow-x-auto pb-2">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex-nowrap justify-start min-w-max">
                  <TabsTrigger 
                    value="current" 
                    className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    Current Location
                  </TabsTrigger>
                  {locations.map((loc) => (
                    <TabsTrigger 
                      key={loc.id} 
                      value={loc.id} 
                      className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {loc.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="current" className="mt-6">
                {geoLoading || isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading weather data...</p>
                  </div>
                ) : (
                  <WeatherDisplay weatherData={weatherData} isLoading={isLoading} />
                )}
              </TabsContent>

              {locations.map((loc) => (
                <TabsContent key={loc.id} value={loc.id} className="mt-6">
                  {!locationWeather[loc.id] ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Loading weather data for {loc.name}...</p>
                    </div>
                  ) : (
                    <WeatherDisplay weatherData={locationWeather[loc.id]} isLoading={false} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Card>
      </div>
      
      {/* Footer with your name and profile */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                © {new Date().getFullYear()} Designed & Developed by Abdul Musawer Dinzad
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://musawer-cv.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                <span>Portfolio</span>
              </a>
              <a 
                href="https://github.com/immusawer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://www.linkedin.com/in/abdul-musawer-dinzad-49a5a41ba/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}