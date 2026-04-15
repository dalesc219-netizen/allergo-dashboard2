import { useState, useEffect, useCallback } from 'react';

export const useWeather = (lat = 55.75, lon = 37.62) => {
  const [forecastData, setForecastData] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchForecast = useCallback(async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&hourly=relative_humidity_2m&timezone=Europe%2FMoscow&forecast_days=10&windspeed_unit=ms`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Сетевая ошибка или API недоступно");
        const data = await res.json();
        
        if (data && data.current_weather) {
          setCurrentWeather(data.current_weather);
        }

        if (data && data.daily) {
          const todayStr = new Date().toISOString().split('T')[0];
          const formatted = data.daily.time
            .map((date, i) => {
              const tempMax = data.daily.temperature_2m_max[i];
              const tempMin = data.daily.temperature_2m_min[i];
              const tempAvg = Math.round((tempMax + tempMin) / 2);
              const precip = data.daily.precipitation_sum[i] || 0;
              const windMax = Math.round(data.daily.windspeed_10m_max[i] || 0);
              
              const hourlyHum = data.hourly?.relative_humidity_2m?.slice(i * 24, (i + 1) * 24) || [];
              const humidity = hourlyHum.length > 0 
                ? Math.round(hourlyHum.reduce((a, b) => a + b, 0) / hourlyHum.length) 
                : 60;

              return { date, tempAvg, precip, windMax, humidity };
            })
            .filter(item => item.date > todayStr); // Оставляем только будущие дни
          setForecastData(formatted);
        }
      } catch (e) {
        console.error("Ошибка при получении прогноза погоды:", e);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
  }, [lat, lon]);

  useEffect(() => {
    fetchForecast();
    // Автоматическое обновление данных каждые 30 минут
    const interval = setInterval(fetchForecast, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchForecast]);

  return { forecastData, currentWeather, isLoading, isError, refetch: fetchForecast };
};