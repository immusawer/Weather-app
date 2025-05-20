import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  CloudLightning, 
  Wind, 
  CloudDrizzle,
  Droplets,
  ThermometerSun,
  ThermometerSnowflake,
  CalendarDays,
  MapPin
} from 'lucide-react';

// Define proper types for weather data
interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
    weathercode?: number[]; // Weather condition code
  };
  location?: {
    name: string;
    country?: string;
  };
  // Add other properties as needed
}

// Helper function to get weather icon based on weather code
const getWeatherIcon = (code?: number) => {
  if (!code) return <Sun className="h-10 w-10 text-yellow-500" />;
  
  // Weather codes based on WMO standards
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  // 45, 48: Fog and depositing rime fog
  // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
  // 56, 57: Freezing Drizzle: Light and dense intensity
  // 61, 63, 65: Rain: Slight, moderate and heavy intensity
  // 66, 67: Freezing Rain: Light and heavy intensity
  // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
  // 77: Snow grains
  // 80, 81, 82: Rain showers: Slight, moderate, and violent
  // 85, 86: Snow showers slight and heavy
  // 95: Thunderstorm: Slight or moderate
  // 96, 99: Thunderstorm with slight and heavy hail
  
  if (code === 0) return <Sun className="h-10 w-10 text-yellow-500" />;
  if (code >= 1 && code <= 3) return <Cloud className="h-10 w-10 text-gray-400" />;
  if (code >= 45 && code <= 48) return <Cloud className="h-10 w-10 text-gray-300" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="h-10 w-10 text-blue-300" />;
  if (code >= 61 && code <= 67) return <CloudRain className="h-10 w-10 text-blue-500" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="h-10 w-10 text-blue-200" />;
  if (code >= 80 && code <= 82) return <CloudRain className="h-10 w-10 text-blue-600" />;
  if (code >= 85 && code <= 86) return <CloudSnow className="h-10 w-10 text-blue-300" />;
  if (code === 95) return <CloudLightning className="h-10 w-10 text-yellow-600" />;
  if (code >= 96) return <CloudLightning className="h-10 w-10 text-yellow-700" />;
  
  return <Sun className="h-10 w-10 text-yellow-500" />; // Default
};

export const WeatherDisplay = ({ 
  weatherData, 
  isLoading 
}: { 
  weatherData: WeatherData | null; 
  isLoading: boolean 
}) => {
  if (isLoading || !weatherData) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Location Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-white/80" />
          <h2 className="text-2xl font-bold">
            {weatherData.location?.name || "Current Location"}
            {weatherData.location?.country && `, ${weatherData.location.country}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-white/70" />
          <p className="text-sm opacity-80">7-Day Weather Forecast</p>
        </div>
      </div>
      
      {/* Weather Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {weatherData.daily.time.map((date: string, index: number) => (
          <Card key={date} className="flex flex-col overflow-hidden border-t-4 border-blue-500 hover:shadow-lg transition-all hover:translate-y-[-2px]">
            <CardHeader className="pb-2 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent">
              <CardTitle className="text-lg font-medium">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <div className="flex justify-center mb-4 mt-2">
                {getWeatherIcon(weatherData.daily.weathercode?.[index])}
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center">
                  <ThermometerSun className="h-4 w-4 mr-1 text-red-500" />
                  <span className="font-medium text-red-500">
                    {weatherData.daily.temperature_2m_max[index]}°C
                  </span>
                </div>
                <div className="flex items-center">
                  <ThermometerSnowflake className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-blue-500">
                    {weatherData.daily.temperature_2m_min[index]}°C
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-2 border-t pt-2">
                <div className="flex items-center">
                  <Wind className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                  <span>{weatherData.daily.windspeed_10m_max[index]} km/h</span>
                </div>
                <div className="flex items-center">
                  <Droplets className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  <span>{weatherData.daily.precipitation_sum[index]} mm</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6">
    <Skeleton className="h-[120px] w-full rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-[220px] w-full rounded-lg" />
      ))}
    </div>
  </div>
);