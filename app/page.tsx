
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
import { MapPin, RefreshCw, Compass, Globe, Github, Linkedin, Trash2, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define proper types for weather data and locations
interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
  };
  location?: {
    name: string;
    country?: string;
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
    
    // Fetch weather for the new location immediately
    const fetchNewLocationWeather = async () => {
      try {
        const data = await fetchWeather(newLocation.latitude, newLocation.longitude);
        data.location = { name: newLocation.name };
        
        setLocationWeather(prev => ({
          ...prev,
          [newLocation.id]: data
        }));
        
        // Automatically switch to the new location
        setActiveLocation(newLocation.id);
      } catch (error) {
        console.error(`Failed to fetch weather for ${newLocation.name}`, error);
      }
    };
    
    fetchNewLocationWeather();
  };

  // Handle location deletion
  const handleDeleteLocation = (locationId: string) => {
    // Filter out the location with the given ID
    const updatedLocations = locations.filter(loc => loc.id !== locationId);
    setLocations(updatedLocations);
    
    // Also remove the weather data for this location
    const updatedWeatherData = { ...locationWeather };
    delete updatedWeatherData[locationId];
    setLocationWeather(updatedWeatherData);
    
    // If the deleted location was active, switch to current location
    if (activeLocation === locationId) {
      setActiveLocation("current");
    }
    
    
    
    toast.success("Location removed successfully");
    
    // If there are no more locations, clear localStorage
    if (updatedLocations.length === 0) {
      localStorage.removeItem('weatherLocations');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Card className="shadow-xl rounded-3xl overflow-hidden border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md mb-8">
          <header className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-2.5 rounded-full shadow-md">
                <CloudSun className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Weather Forecast
              </h1>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemeToggle />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleRefresh}
                      className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border-slate-200 dark:border-slate-700"
                      aria-label="Refresh weather data"
                    >
                      <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh weather data</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AddLocationDialog onAdd={handleAddLocation} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add new location</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>

          <div className="p-6">
            <Tabs 
              defaultValue="current" 
              value={activeLocation}
              onValueChange={(value) => setActiveLocation(value)}
              className="space-y-6"
            >
              <div className="overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full flex-nowrap justify-start min-w-max shadow-inner">
                  <TabsTrigger 
                    value="current" 
                    className="rounded-full px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    Current Location
                  </TabsTrigger>
                  {locations.map((loc) => (
                    <TabsTrigger 
                      key={loc.id} 
                      value={loc.id} 
                      className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all relative pr-8"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {loc.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent tab switching when clicking delete
                          handleDeleteLocation(loc.id);
                        }}
                        className="absolute right-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                        aria-label={`Delete ${loc.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="current" className="mt-6 animate-fadeIn">
                {geoLoading || isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <RefreshCw className="h-12 w-12 animate-spin text-blue-500 opacity-30" />
                      <RefreshCw className="h-12 w-12 animate-spin text-blue-500 absolute top-0 left-0 animate-ping opacity-20" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading weather data...</p>
                  </div>
                ) : (
                  <WeatherDisplay weatherData={weatherData} isLoading={isLoading} />
                )}
              </TabsContent>

              {locations.map((loc) => (
                <TabsContent key={loc.id} value={loc.id} className="mt-6 animate-fadeIn">
                  {!locationWeather[loc.id] ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative">
                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500 opacity-30" />
                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500 absolute top-0 left-0 animate-ping opacity-20" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading weather data for {loc.name}...</p>
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
      <footer className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                © {new Date().getFullYear()} Designed & Developed by Abdul Musawer Dinzad
              </p>
            </div>
            <div className="flex items-center gap-5">
              <a 
                href="https://musawer-cv.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-2 group"
              >
                <Globe className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="group-hover:underline">Portfolio</span>
              </a>
              <a 
                href="https://github.com/immusawer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Github className="h-5 w-5 hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.linkedin.com/in/abdul-musawer-dinzad-49a5a41ba/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Linkedin className="h-5 w-5 hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}