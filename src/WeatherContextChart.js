import React, { useState, useMemo } from 'react';
import { CloudRain } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

const WeatherContextChart = ({
  filteredArchiveKeys,
  archiveLabels,
  isMobile,
  chartOptionsCommon,
  weatherData2023,
  weatherData2024,
  weatherData2025,
  weatherData2026
}) => {
  const [weatherScaleType, setWeatherScaleType] = useState('linear');
  const [weatherVis, setWeatherVis] = useState({
    temp: true, precip: true, humidity: true, '2026': true, '2025': false, '2024': false, '2023': false
  });

  const maxPrecip = useMemo(() => {
    let mx = 1;
    filteredArchiveKeys.forEach(k => {
      const dStr = k.substring(0, 5);
      [weatherData2023, weatherData2024, weatherData2025, weatherData2026].forEach(arc => {
        if (arc && arc[dStr] && arc[dStr].precip > mx) mx = arc[dStr].precip;
      });
    });
    return mx;
  }, [filteredArchiveKeys, weatherData2023, weatherData2024, weatherData2025, weatherData2026]);

  const xAxisTicksConfig = useMemo(() => ({
    maxRotation: 0, autoSkip: true, maxTicksLimit: 12, color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }
  }), []);

  const weatherArchiveChartData = useMemo(() => {
    const cleanLog = (val) => (weatherScaleType === 'logarithmic' && val === 0) ? null : val;
    const tension = isMobile ? 0.1 : 0.4;
    return {
      labels: archiveLabels,
      datasets: [
        { type: 'bar',  label: 'Осадки (2023)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2023[k.substring(0, 5)]?.precip ?? null)),   backgroundColor: 'rgba(50, 215, 75, 0.2)', borderColor: '#32D74B', borderWidth: 1, borderRadius: 0, yAxisID: 'yPrecip',   hidden: !weatherVis.precip || !weatherVis['2023'] },
        { type: 'line', label: 'Температура (2023)', normalized: true, data: filteredArchiveKeys.map(k => weatherData2023[k.substring(0, 5)]?.tempMax ?? null),  borderColor: '#32D74B',  backgroundColor: 'transparent', borderWidth: isMobile ? 1.5 : 2.5, tension, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, spanGaps: true, yAxisID: 'yTemp', hidden: !weatherVis.temp || !weatherVis['2023'] },
        { type: 'line', label: 'Влажность (2023)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2023[k.substring(0, 5)]?.humidity ?? null)), borderColor: '#32D74B',  borderWidth: isMobile ? 1 : 1.5, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, tension, spanGaps: true, yAxisID: 'yHumidity', hidden: !weatherVis.humidity || !weatherVis['2023'] },
        
        { type: 'bar',  label: 'Осадки (2024)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2024[k.substring(0, 5)]?.precip ?? null)),   backgroundColor: 'rgba(255, 138, 101, 0.2)', borderColor: '#FF8A65', borderWidth: 1, borderRadius: 0, yAxisID: 'yPrecip',   hidden: !weatherVis.precip || !weatherVis['2024'] },
        { type: 'line', label: 'Температура (2024)', normalized: true, data: filteredArchiveKeys.map(k => weatherData2024[k.substring(0, 5)]?.tempMax ?? null),  borderColor: '#FF8A65',  backgroundColor: 'transparent', borderWidth: isMobile ? 1.5 : 2.5, tension, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, spanGaps: true, yAxisID: 'yTemp', hidden: !weatherVis.temp || !weatherVis['2024'] },
        { type: 'line', label: 'Влажность (2024)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2024[k.substring(0, 5)]?.humidity ?? null)), borderColor: '#FF8A65',  borderWidth: isMobile ? 1 : 1.5, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, tension, spanGaps: true, yAxisID: 'yHumidity', hidden: !weatherVis.humidity || !weatherVis['2024'] },
        
        { type: 'bar',  label: 'Осадки (2025)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2025[k.substring(0, 5)]?.precip ?? null)),   backgroundColor: 'rgba(255, 214, 10, 0.2)', borderColor: '#FFD60A', borderWidth: 1, borderRadius: 0, yAxisID: 'yPrecip',   hidden: !weatherVis.precip || !weatherVis['2025'] },
        { type: 'line', label: 'Температура (2025)', normalized: true, data: filteredArchiveKeys.map(k => weatherData2025[k.substring(0, 5)]?.tempMax ?? null),  borderColor: '#FFD60A',  backgroundColor: 'transparent', borderWidth: isMobile ? 1.5 : 2.5, tension, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, spanGaps: true, yAxisID: 'yTemp', hidden: !weatherVis.temp || !weatherVis['2025'] },
        { type: 'line', label: 'Влажность (2025)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2025[k.substring(0, 5)]?.humidity ?? null)), borderColor: '#FFD60A',  borderWidth: isMobile ? 1 : 1.5, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, tension, spanGaps: true, yAxisID: 'yHumidity', hidden: !weatherVis.humidity || !weatherVis['2025'] },
        
        { type: 'bar',  label: 'Осадки (2026)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2026[k.substring(0, 5)]?.precip ?? null)),   backgroundColor: 'rgba(100, 210, 255, 0.2)', borderColor: '#64D2FF', borderWidth: 1, borderRadius: 0, yAxisID: 'yPrecip',   hidden: !weatherVis.precip || !weatherVis['2026'] },
        { type: 'line', label: 'Температура (2026)', normalized: true, data: filteredArchiveKeys.map(k => weatherData2026[k.substring(0, 5)]?.tempMax ?? null),  borderColor: '#64D2FF',  backgroundColor: 'transparent', borderWidth: isMobile ? 2 : 3,   tension, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, spanGaps: true, yAxisID: 'yTemp', hidden: !weatherVis.temp || !weatherVis['2026'] },
        { type: 'line', label: 'Влажность (2026)', normalized: true, data: filteredArchiveKeys.map(k => cleanLog(weatherData2026[k.substring(0, 5)]?.humidity ?? null)), borderColor: '#64D2FF',  borderWidth: isMobile ? 1 : 1.5, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, tension, spanGaps: true, yAxisID: 'yHumidity', hidden: !weatherVis.humidity || !weatherVis['2026'] }
      ]
    };
  }, [archiveLabels, filteredArchiveKeys, weatherData2023, weatherData2024, weatherData2025, weatherData2026, weatherScaleType, weatherVis, isMobile]);

  const weatherChartOptions = useMemo(() => ({
    ...chartOptionsCommon,
    barPercentage: 0.9,
    categoryPercentage: 0.8,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        displayColors: false,
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#EBEBF5',
        titleFont: { size: isMobile ? 13 : 14, weight: 'bold' },
        bodyFont: { size: isMobile ? 11 : 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: function(context) { return context && context[0] ? context[0].label : ''; },
          label: function() { return ''; },
          afterBody: function(context) {
            if (!context || !context.length) return [];
            const monthReverseMap = {'Янв':'01', 'Фев':'02', 'Мар':'03', 'Апр':'04', 'Мая':'05', 'Июн':'06', 'Июл':'07', 'Авг':'08', 'Сен':'09', 'Окт':'10', 'Ноя':'11', 'Дек':'12'};
            const labelStr = context[0].label || '';
            const [day, monthStr] = labelStr.split(' ');
            if (!day || !monthStr) return [];
            const month = monthReverseMap[monthStr];
            if (!month) return [];
            const key = `${month}-${day.padStart(2, '0')}`;
            
            const activeYears = ['2026', '2025', '2024', '2023'];
            let footerLines = [];
            const weatherArchives = { '2023': weatherData2023, '2024': weatherData2024, '2025': weatherData2025, '2026': weatherData2026 };

            activeYears.forEach(year => {
              const isYearVisible = context.some(item => item.dataset.label.includes(year));
              if (!isYearVisible) return;
              const archive = weatherArchives[year];
              const w = archive ? archive[key] : null;
              if (!w) return;

              const temp = w.tempMax !== undefined ? `${w.tempMax > 0 ? '+' : ''}${w.tempMax}°` : '--';
              const precip = w.precip !== undefined ? `${w.precip} мм` : '0 мм';
              const humidity = w.humidity !== undefined ? `${w.humidity}%` : '--';
              const wind = w.windDir && w.windSpeedMax ? `${w.windDir} ${w.windSpeedMax}м/с` : '';
              const phenomena = Array.isArray(w.phenomena) && w.phenomena.length > 0 ? w.phenomena.join(', ') : '';

              footerLines.push(`${year}: 🌡️ ${temp} | 💧 ${precip} | 💦 ${humidity}`);
              if (wind || phenomena) {
                 const extra = [wind, phenomena].filter(Boolean).join(' • ');
                 footerLines.push(`   └ 🌬️ ${extra}`);
              }
              footerLines.push('');
            });
            if (footerLines.length > 0) footerLines.pop();
            return footerLines;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: xAxisTicksConfig },
      yTemp: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {color: '#EBEBF599', callback: v => (v + '°')} },
      yPrecip: { type: weatherScaleType, position: 'right', display: false, min: weatherScaleType === 'logarithmic' ? 0.1 : 0, max: weatherScaleType === 'logarithmic' ? Math.max(maxPrecip * 4, 10) : maxPrecip * 4 },
      yHumidity: { type: weatherScaleType, position: 'right', min: weatherScaleType === 'logarithmic' ? 1 : 0, max: 100, display: true, grid: { display: false }, ticks: { color: '#64D2FF', callback: function(value) { return (weatherScaleType === 'logarithmic' ? ([1,10,100].includes(value) ? value + '%' : null) : value + '%'); } } }
    }
  }), [chartOptionsCommon, isMobile, weatherData2023, weatherData2024, weatherData2025, weatherData2026, weatherScaleType, maxPrecip]);

  const maskChartData = useMemo(() => ({
    ...weatherArchiveChartData,
    datasets: weatherArchiveChartData.datasets.map(ds => ({
      ...ds,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointRadius: 0,
      pointHoverRadius: 0
    }))
  }), [weatherArchiveChartData]);

  const maskChartOptions = useMemo(() => ({
    ...weatherChartOptions,
    scales: {
      ...weatherChartOptions.scales,
      x: {
        ...(weatherChartOptions.scales?.x || {}),
        ticks: {
          ...(weatherChartOptions.scales?.x?.ticks || {}),
          color: 'transparent'
        }
      }
    },
    plugins: {
      ...weatherChartOptions.plugins,
      tooltip: { enabled: false }
    }
  }), [weatherChartOptions]);

  return (
    <div className="card overflow-hidden w-full" style={{ marginTop: 15, marginBottom: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <h3 className="section-title" style={{ marginBottom: 5 }}><CloudRain size={18} /> Погодный контекст</h3>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 0 }}>Температура (линии) и осадки (столбцы) за 2023–2026 годы. Цвет столбцов соответствует цвету линии того же года.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div className="segment-control" style={{ width: 90, padding: 2, flexShrink: 0, height: 26 }}>
            <div className="segment-indicator" style={{ transform: `translateX(${weatherScaleType === 'linear' ? 0 : 100}%)`, width: 'calc(50% - 2px)' }}></div>
            <button type="button" className={`segment-btn ${weatherScaleType === 'linear' ? 'active' : ''}`} onClick={() => setWeatherScaleType('linear')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LIN</button>
            <button type="button" className={`segment-btn ${weatherScaleType === 'logarithmic' ? 'active' : ''}`} onClick={() => setWeatherScaleType('logarithmic')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LOG</button>
          </div>
        </div>
      </div>

      <div className="custom-legend-container" style={{ flexDirection: 'column', gap: 12, marginBottom: 15, background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
          <div className={`legend-item ${!weatherVis.temp ? 'hidden-dataset' : ''}`} onClick={() => setWeatherVis(p => ({...p, temp: !p.temp}))}>
            <div style={{ width: 14, height: 2, backgroundColor: '#fff', borderRadius: 1 }}></div>
            <span>Температура</span>
          </div>
          <div className={`legend-item ${!weatherVis.precip ? 'hidden-dataset' : ''}`} onClick={() => setWeatherVis(p => ({...p, precip: !p.precip}))}>
            <div style={{ width: 12, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: 2 }}></div>
            <span>Осадки</span>
          </div>
          <div className={`legend-item ${!weatherVis.humidity ? 'hidden-dataset' : ''}`} onClick={() => setWeatherVis(p => ({...p, humidity: !p.humidity}))}>
            <div style={{ width: 14, borderBottom: '2px dashed #64D2FF' }}></div>
            <span style={{ color: weatherVis.humidity ? '#64D2FF' : 'inherit', fontWeight: weatherVis.humidity ? 600 : 500 }}>Влажность</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['2026', '2025', '2024', '2023'].map(year => {
            const colors = {'2023':'#32D74B', '2024':'#FF8A65', '2025':'#FFD60A', '2026':'#64D2FF'};
            return (
              <div key={year} className={`legend-item ${!weatherVis[year] ? 'hidden-dataset' : ''}`} onClick={() => setWeatherVis(p => ({...p, [year]: !p[year]}))}>
                <div className="legend-color-box" style={{ backgroundColor: colors[year] }}></div>
                <span>{year} год</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <div className="chart-scroll-wrapper custom-scrollbar">
          <div className="chart-container">
            <Bar data={weatherArchiveChartData} options={weatherChartOptions} />
          </div>
        </div>
        
        {/* Левая фиксированная ось (Температура) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 10, pointerEvents: 'none', clipPath: 'inset(0 calc(100% - 45px) 0 0)'
        }}>
          <div className="chart-scroll-wrapper custom-scrollbar" style={{ overflow: 'hidden' }}>
            <div className="chart-container">
              <Bar data={maskChartData} options={maskChartOptions} />
            </div>
          </div>
        </div>

        {/* Правая фиксированная ось (Осадки и Влажность) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 10, pointerEvents: 'none', clipPath: 'inset(0 0 0 calc(100% - 45px))'
        }}>
          {/* RTL-направление заставляет график прижаться к правому краю, делая правую ось видимой */}
          <div className="chart-scroll-wrapper custom-scrollbar" style={{ overflow: 'hidden', direction: 'rtl' }}>
            <div className="chart-container" style={{ direction: 'ltr' }}>
              <Bar data={maskChartData} options={maskChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherContextChart;