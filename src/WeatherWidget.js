import React from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';

const WeatherWidget = ({ weather, forecastData = [], loading }) => {

  const getWeatherIcon = (code, isDay) => {
    // Расшифровка кодов WMO
    if (code === 0) return isDay ? <Sun size={28} color="#FFD60A" /> : <Moon size={28} color="#EBEBF5" />;
    if (code === 1 || code === 2) return <Cloud size={28} color="#EBEBF5" />; // Малооблачно
    if (code === 3) return <Cloud size={28} color="#8E8E93" />; // Пасмурно
    if (code >= 50 && code <= 69) return <CloudRain size={28} color="#0A84FF" />; // Дождь
    if (code >= 70 && code <= 79) return <CloudSnow size={28} color="#FFFFFF" />; // Снег
    if (code >= 95) return <CloudLightning size={28} color="#FF9F0A" />; // Гроза
    return <Cloud size={28} color="#8E8E93" />;
  };

  const getWeatherText = (code) => {
    if (code === 0) return 'Ясно';
    if (code === 1 || code === 2) return 'Малооблачно';
    if (code === 3) return 'Пасмурно';
    if (code >= 50 && code <= 69) return 'Дождь';
    if (code >= 70 && code <= 79) return 'Снег';
    if (code >= 95) return 'Гроза';
    return 'Облачно';
  };

  const getWindDirection = (degrees) => {
    if (degrees === null || degrees === undefined) return '';
    const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    return dirs[Math.round(degrees / 45) % 8];
  };

  if (loading && !weather) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.05)', minWidth: '130px', height: '48px'
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Загрузка...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
        gap: '8px',
      background: 'rgba(28, 28, 30, 0.6)', 
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '12px', 
        padding: '8px 12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      {getWeatherIcon(weather.weathercode, weather.is_day)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', lineHeight: '1' }}>
            {Math.round(weather.temperature)}°C
          </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1' }}>
            {getWeatherText(weather.weathercode)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
          <Wind size={12} strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: '1' }}>
            {Math.round(weather.windspeed)} м/с, {getWindDirection(weather.winddirection)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;