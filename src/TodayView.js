import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TreeDeciduous, Leaf, TreePine, TrendingUp, Loader2, MessageCircle } from 'lucide-react';

const TodayView = ({ latestData, historyData, isLoading }) => {
  // Состояние с данными для графика
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: 'Ольха', data: [], borderColor: '#FF9F0A', backgroundColor: 'rgba(255, 159, 10, 0.1)', fill: true, tension: 0.4 },
      { label: 'Орешник', data: [], borderColor: '#FFD60A', backgroundColor: 'rgba(255, 214, 10, 0.1)', fill: true, tension: 0.4 },
      { label: 'Береза', data: [], borderColor: '#FF453A', backgroundColor: 'rgba(255, 69, 58, 0.1)', fill: true, tension: 0.4 },
      { label: 'Дуб', data: [], borderColor: '#8A0303', backgroundColor: 'rgba(138, 3, 3, 0.1)', fill: true, tension: 0.4 }
    ]
  });

  // Диапазон дат графика (7 - неделя, 30 - месяц, 'all' - все время)
  const [timeRange, setTimeRange] = useState(30);
  const [scaleType, setScaleType] = useState('linear'); // 'linear' or 'logarithmic'
  const [hiddenDatasets, setHiddenDatasets] = useState({});

  const toggleDataset = (label) => {
    setHiddenDatasets(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const activeChartData = {
    ...chartData,
    datasets: chartData.datasets.map(ds => ({
      ...ds,
      hidden: !!hiddenDatasets[ds.label]
    }))
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 30, 0.95)', titleColor: 'rgba(235, 235, 245, 0.6)', bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, padding: 12, boxPadding: 6, usePointStyle: true,
        titleFont: { size: 13, family: "'-apple-system', 'SF Pro Display', sans-serif" },
        bodyFont: { size: 14, weight: 'bold', family: "'-apple-system', 'SF Pro Display', sans-serif" },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y + ' ед/м³';
            return label;
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: '#EBEBF599' }, grid: { display: false } },
      y: { type: scaleType, ticks: { color: '#EBEBF599' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
    }
  };

  // Расчет уровня риска
  const getRiskLevel = (data) => {
    if (!data) return { level: 'safe', label: 'НЕТ ДАННЫХ', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.1)' };

    const total = (data.alder || 0) + (data.hazel || 0) + (data.birch || 0) + (data.oak || 0);
    
    if (data.birch > 800 || total > 1000) return { level: 'critical', label: 'КРИТИЧЕСКИЙ', color: 'var(--critical)', bg: 'rgba(255, 69, 58, 0.15)' };
    if (data.alder > 300 || data.hazel > 150 || total > 400) return { level: 'high', label: 'ВЫСОКИЙ', color: 'var(--high)', bg: 'rgba(255, 159, 10, 0.15)' };
    if (total > 50) return { level: 'warning', label: 'СРЕДНИЙ', color: 'var(--warning)', bg: 'rgba(255, 214, 10, 0.15)' };
    if (total > 10) return { level: 'safe', label: 'НИЗКИЙ', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
    return { level: 'safe', label: 'ОЧЕНЬ НИЗКИЙ', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
  };

  const risk = getRiskLevel(latestData);
  const riskBadgeClass = `risk-badge ${risk.level === 'high' || risk.level === 'critical' ? 'breathe-effect' : ''}`;
  
  // Эффект для локальной фильтрации данных графика при переключении периода
  useEffect(() => {
    if (!historyData || historyData.length === 0) {
      setChartData(prev => ({ ...prev, labels: [], datasets: prev.datasets.map(ds => ({ ...ds, data: [] })) }));
      return;
    }
    let filteredData = [...historyData].reverse();
    if (timeRange !== 'all') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      filteredData = filteredData.filter(item => new Date(item.date) >= cutoffDate);
    }
    const labels = [];
    const alderData = []; const hazelData = []; const birchData = []; const oakData = [];
    filteredData.forEach(data => {
      const [year, month, day] = data.date.split('-');
      labels.push(`${day}.${month}`);
      alderData.push(data.alder || 0); hazelData.push(data.hazel || 0); birchData.push(data.birch || 0); oakData.push(data.oak || 0);
    });
    setChartData({
      labels, datasets: [
        { label: 'Ольха', data: alderData, borderColor: '#FF9F0A', backgroundColor: 'rgba(255, 159, 10, 0.1)', fill: true, tension: 0.4 },
        { label: 'Орешник', data: hazelData, borderColor: '#FFD60A', backgroundColor: 'rgba(255, 214, 10, 0.1)', fill: true, tension: 0.4 },
        { label: 'Береза', data: birchData, borderColor: '#FF453A', backgroundColor: 'rgba(255, 69, 58, 0.1)', fill: true, tension: 0.4 },
        { label: 'Дуб', data: oakData, borderColor: '#8A0303', backgroundColor: 'rgba(138, 3, 3, 0.1)', fill: true, tension: 0.4 }
      ]
    });
  }, [historyData, timeRange]);

  if (isLoading) {
    return (
      <div className="view-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, color: 'var(--text-secondary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <span>Загрузка данных...</span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="view-pane">
      {/* КАРТОЧКИ ПОСЛЕДНИХ ЗАМЕРОВ */}
      {latestData && (
        <div className="card">
          <div className="risk-header">
            <h2 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Данные за {latestData.date.split('-').reverse().join('.')}</h2>
            <div className={riskBadgeClass} style={{ background: risk.bg, color: risk.color }}>
              {risk.label}
            </div>
          </div>
          <div className="pollen-list">
            <div className="pollen-item">
              <div className="pollen-left"><div className="pollen-icon-wrapper" style={{ background: 'rgba(255, 159, 10, 0.15)', color: 'var(--high)' }}><TreeDeciduous size={20} /></div><div className="pollen-name">Ольха</div></div>
              <div className="pollen-right"><div className="pollen-value">{latestData.alder || 0}</div><div className="pollen-trend">ед/м³</div></div>
            </div>
            <div className="pollen-item">
              <div className="pollen-left"><div className="pollen-icon-wrapper" style={{ background: 'rgba(255, 214, 10, 0.15)', color: 'var(--warning)' }}><Leaf size={20} /></div><div className="pollen-name">Орешник</div></div>
              <div className="pollen-right"><div className="pollen-value">{latestData.hazel || 0}</div><div className="pollen-trend">ед/м³</div></div>
            </div>
            <div className="pollen-item">
              <div className="pollen-left"><div className="pollen-icon-wrapper" style={{ background: 'rgba(255, 69, 58, 0.15)', color: 'var(--critical)' }}><TreePine size={20} /></div><div className="pollen-name">Береза</div></div>
              <div className="pollen-right"><div className="pollen-value">{latestData.birch || 0}</div><div className="pollen-trend">ед/м³</div></div>
            </div>
            <div className="pollen-item">
              <div className="pollen-left"><div className="pollen-icon-wrapper" style={{ background: 'rgba(138, 3, 3, 0.15)', color: 'var(--burgundy)' }}><TreeDeciduous size={20} /></div><div className="pollen-name">Дуб</div></div>
              <div className="pollen-right"><div className="pollen-value">{latestData.oak || 0}</div><div className="pollen-trend">ед/м³</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="section-title" style={{ margin: 0 }}><TrendingUp size={18} /> Динамика пыления</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="segment-control" style={{ height: 30, padding: 2 }}>
              <div className="segment-indicator" style={{ transform: `translateX(${scaleType === 'linear' ? 0 : 100}%)`, width: 'calc(50% - 2px)', background: '#48484A' }}></div>
              <button className={`segment-btn${scaleType === 'linear' ? ' active' : ''}`} onClick={() => setScaleType('linear')} style={{ fontSize: 12, padding: '0 10px' }}>LIN</button>
              <button className={`segment-btn${scaleType === 'logarithmic' ? ' active' : ''}`} onClick={() => setScaleType('logarithmic')} style={{ fontSize: 12, padding: '0 10px' }}>LOG</button>
            </div>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value={7} style={{ color: '#000' }}>Неделя</option><option value={30} style={{ color: '#000' }}>Месяц</option><option value="all" style={{ color: '#000' }}>Все время</option>
            </select>
          </div>
        </div>
        
        {/* КАСТОМНАЯ ЛЕГЕНДА */}
        <div className="custom-legend-container">
          <div className="legend-group">
            <div className="legend-group-title">Деревья</div>
            {chartData.datasets.map(ds => (<div key={ds.label} className={`legend-item${hiddenDatasets[ds.label] ? ' hidden-dataset' : ''}`} onClick={() => toggleDataset(ds.label)} style={{ justifyContent: 'space-between', width: '100%', minWidth: '130px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="legend-color-box" style={{ backgroundColor: ds.borderColor }}></div><span>{ds.label}</span></div><label className="toggle-switch" onClick={e => e.stopPropagation()}><input type="checkbox" checked={!hiddenDatasets[ds.label]} onChange={() => toggleDataset(ds.label)} /><span className="slider"></span></label></div>))}
          </div>
        </div>
        <div className="chart-container">
          <Line data={activeChartData} options={chartOptions} />
          {chartData.labels.length === 0 && (<div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,28,30,0.6)', backdropFilter: 'blur(2px)', borderRadius: 12, color: 'var(--text-main)', fontSize: 14, textAlign: 'center', padding: 20 }}>База данных пуста.<br/>Нажмите «+» в правом верхнем углу, чтобы внести первые замеры.</div>)}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title"><MessageCircle size={18} /> Инсайты (VK Pollen Club)</h3>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 15 }}>Свежие комментарии из Москвы о текущей обстановке.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="insight-comment">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Антон М.</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Сегодня, 08:30</span>
            </div>
            Ольха вернулась с новыми силами (207). Вчера было нормально, а сегодня утром проснулся с заложенным носом и отекшими глазами.
          </div>
          <div className="insight-comment">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Елена В.</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Вчера, 21:15</span>
            </div>
            Орешник тоже не отстает (166). Ветер разносит пыльцу, на улице без очков и маски делать нечего, всё сразу чешется.
          </div>
        </div>
      </div>
    </div>
  );
};
export default TodayView;