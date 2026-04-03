import React, { useState, useEffect } from 'react';
import { Thermometer, Wind, Droplet } from 'lucide-react';

// Кастомный хук для загрузки данных о погоде
export const useWeather = (lat, lon) => {
  const [weather, setWeather] = useState({ temp: null, hum: null, windSpeed: null, windDirStr: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=ms`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        const temp = data.current.apparent_temperature;
        const hum = data.current.relative_humidity_2m;
        const windSpeed = data.current.wind_speed_10m;
        const windDir = data.current.wind_direction_10m;
        
        // Вычисление направления ветра
        const dirs = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
        const windDirStr = dirs[Math.round(windDir / 22.5) % 16];

        setWeather({ temp, hum, windSpeed, windDirStr });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lon]);

  return { weather, loading, error };
};

const WeatherWidget = ({ lat = 55.75, lon = 37.62 }) => {
  const { weather, loading, error } = useWeather(lat, lon);

  if (loading) return <div className="header-weather"><span style={{fontSize: 12, color: 'var(--text-secondary)'}}>Загрузка...</span></div>;
  if (error) return null; // При ошибке просто скрываем виджет, чтобы не ломать шапку

  const { temp, hum, windSpeed, windDirStr } = weather;

  return (
    <div className="header-weather" id="live-weather">
      <div className="weather-stat-mini">
        <Thermometer size={16} className="icon-temp" />
        <span>{temp > 0 ? '+' : ''}{Math.round(temp)}°</span>
      </div>
      <div className="weather-stat-mini">
        <Wind size={16} className="icon-wind" />
        <span>{windDirStr} {Math.round(windSpeed)}</span>
      </div>
      <div className="weather-stat-mini">
        <Droplet size={16} className="icon-drop" />
        <span>{Math.round(hum)}%</span>
      </div>
    </div>
  );
};

export default WeatherWidget;