'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { addLocation } from '@/lib/api';
import { geocodeCity } from '@/lib/geocode';
import { fetchWeather } from '@/lib/api';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { 
  Search, 
  MapPin, 
  Plus, 
  Loader2, 
  Globe, 
  Check, 
  ArrowRight,
} from 'lucide-react';

// Define Location interface to match page.tsx
interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Define WeatherData interface to match the one in WeatherDisplay
interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
  };
}

export const AddLocationDialog = ({ onAdd }: { onAdd: (location: Location) => void }) => {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    setSearchResults(null);
    setWeatherData(null);
    
    try {
      // Get coordinates from geocoding service
      const { lat, lon, name: formattedName } = await geocodeCity(name);
      
      // Create a temporary location object
      const tempLocation: Location = {
        id: `temp-${Date.now()}`,
        name: formattedName || name,
        latitude: lat,
        longitude: lon
      };
      
      // Set the search results
      setSearchResults(tempLocation);
      
      // Fetch weather data for this location
      setIsWeatherLoading(true);
      const data = await fetchWeather(lat, lon);
      setWeatherData(data);
      
      toast.success('Location found');
    } catch (err) {
      toast.error('Failed to find location');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsWeatherLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!searchResults) return;
    
    try {
      // Add location to backend
      const response = await addLocation({ name: searchResults.name });
      
      // Call onAdd with the new location data
      onAdd({
        ...searchResults,
        id: response.id || searchResults.id
      });
      
      toast.success('Location added successfully');
      setIsOpen(false);
      setName(''); // Reset the input field
      setSearchResults(null);
      setWeatherData(null);
    } catch (err) {
      toast.error('Failed to add location');
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setName('');
        setSearchResults(null);
        setWeatherData(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          <Plus className="h-5 w-5" />
          <span>Add Location</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-blue-500" />
            Add New Location
          </DialogTitle>
          <DialogDescription>
            Search for a city to add it to your weather locations.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="space-y-4 mt-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter city name"
                required
                className="pl-10 h-11 border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700 h-11 px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </form>
        
        {searchResults && (
          <div className="mt-6 border rounded-lg p-5 bg-card/50">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Search Result: {searchResults.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              Coordinates: {searchResults.latitude.toFixed(4)}, {searchResults.longitude.toFixed(4)}
            </p>
            
            {isWeatherLoading ? (
              <div className="text-center py-8 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">Loading weather data...</p>
              </div>
            ) : weatherData ? (
              <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-background">
                <WeatherDisplay weatherData={weatherData} isLoading={false} />
              </div>
            ) : null}
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleAddLocation} 
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Add This Location
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};