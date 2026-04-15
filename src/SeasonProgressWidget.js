import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// Компонент для плавной анимации "бегущих цифр"
const AnimatedNumber = ({ value, padZero = false, delay = 0 }) => {
  const progress = useMotionValue(0);

  const formatted = useTransform(progress, (latest) => {
    if (latest < 0.6) {
      // Эффект рулетки: случайные числа первые 60% времени
      const rand = Math.floor(Math.random() * 99);
      return padZero ? String(rand).padStart(2, '0') : rand.toString();
    }
    // Плавное приближение к реальному значению в финальной фазе
    const endProgress = (latest - 0.6) / 0.4;
    const val = Math.round(value * endProgress);
    return padZero ? String(val).padStart(2, '0') : val.toLocaleString('ru-RU');
  });

  // Динамический градиентный шлейф (Motion Blur эффект)
  const textShadow = useTransform(
    progress,
    [0, 0.4, 0.7, 1],
    [
      '0 -18px 24px rgba(255, 255, 255, 0.45), 0 18px 24px rgba(255, 255, 255, 0.45)',
      '0 -8px 12px rgba(255, 255, 255, 0.2), 0 8px 12px rgba(255, 255, 255, 0.2)',
      '0 0px 0px rgba(255, 255, 255, 0)',
      '0 0px 0px rgba(255, 255, 255, 0)'
    ]
  );

  // Легкое вытягивание по вертикали для ощущения скорости
  const scaleY = useTransform(progress, [0, 0.4, 1], [1.25, 1.1, 1]);

  useEffect(() => {
    progress.set(0); // Сброс при изменении value
    const controls = animate(progress, 1, { 
      duration: 1.8, 
      delay: delay,
      ease: [0.16, 1, 0.3, 1], // Нелинейная скорость: быстрый старт, плавное замедление
      onComplete: () => {
        // Легкий Haptic Feedback (вибрация 20мс) по окончании анимации
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
    });
    return controls.stop;
  }, [value, progress, delay]);

  return <motion.span style={{ display: 'inline-block', textShadow, scaleY }}>{formatted}</motion.span>;
};

// Аппроксимация климатической нормы температуры для Москвы (весна)
const getMoscowAvgTemp = (dayOfYear) => {
  if (dayOfYear < 60) return -5; // До 1 марта
  if (dayOfYear > 150) return 18; // После 30 мая
  return -3 + (dayOfYear - 60) * 0.233; // Линейная интерполяция
};

// Гибридный термо-кинетический расчет накопленных GDD и истощения резервуара
const calculateProgress = (historyData, tBase, gddStart, gddEnd, currentYear, pollenKeys = []) => {
  let gdd = 0;
  let reservoir = 100;
  let started = false;
  let finished = false;
  let finishDay = null;
  let consecutivePollenDays = 0;

  const now = new Date();
  const startOfYear = new Date(currentYear, 0, 0);
  const currentDayOfYear = Math.floor((now - startOfYear) / 86400000);

  for (let d = 60; d <= currentDayOfYear; d++) {
    const targetDate = new Date(currentYear, 0, d);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    const dayData = historyData.find(item => item.date === dateStr);
    let temp = getMoscowAvgTemp(d);
    let precip = 0;
    let humidity = 60;
    let wind = 3;
    
    if (dayData) {
      if (dayData.tempAvg !== undefined) temp = dayData.tempAvg;
      else if (dayData.tempMax !== undefined && dayData.tempMin !== undefined) temp = (dayData.tempMax + dayData.tempMin) / 2;
      
      if (dayData.precip !== undefined) precip = dayData.precip;
      if (dayData.humidity !== undefined) humidity = dayData.humidity;
      if (dayData.windMax !== undefined) wind = dayData.windMax;
    }

    let dailyGdd = Math.max(temp - tBase, 0);
    gdd += dailyGdd;

    // Проверка фактических данных с ловушек
    let dailyPollen = 0;
    if (dayData && pollenKeys.length > 0) {
      pollenKeys.forEach(k => { dailyPollen += (Number(dayData[k]) || 0); });
    }

    if (dailyPollen >= 10) {
      consecutivePollenDays++;
    } else if (dailyPollen < 5) {
      consecutivePollenDays = 0;
    }

    // Старт: по теплу (GDD) ИЛИ по факту зафиксированной пыльцы (разово >20 или стабильно >10 два дня)
    if (gdd >= gddStart || dailyPollen >= 20 || consecutivePollenDays >= 2) {
      started = true;
    }

    if (started && reservoir > 0) {
      // Ингибиторы: Осадки обнуляют эмиссию, высокая влажность блокирует раскрытие
      if (precip > 1.0 || humidity > 85) {
        // Блокировка эмиссии, резервуар не расходуется
      } else {
        let baseDepletion = (dailyGdd / (gddEnd - gddStart)) * 100;
        // Если пыльца летит, а расчетного тепла нет (аномалия/занос) - принудительно расходуем резервуар
        if (baseDepletion === 0 && dailyPollen >= 5) {
          baseDepletion = 1.5; 
        }
        let windFactor = Math.max(1, wind / 3);
        let drynessFactor = humidity < 40 ? 1.2 : 1.0;
        reservoir -= baseDepletion * windFactor * drynessFactor;
        if (reservoir <= 0) {
          reservoir = 0;
          finished = true;
          finishDay = d;
        }
      }
    }
  }

  return { gdd, reservoir, started, finished, finishDay };
};

// Прогнозирование дней до старта
const estimateDaysToStart = (currentGdd, targetGdd, tBase, startDayOfYear, forecastData) => {
  let gdd = currentGdd;
  let days = 0;
  let d = startDayOfYear;
  while (gdd < targetGdd && days < 150) {
    days++;
    d++;
    let temp = getMoscowAvgTemp(d);
    if (days <= 7 && forecastData && forecastData[days - 1] && forecastData[days - 1].tempAvg !== undefined) {
        temp = forecastData[days - 1].tempAvg;
    }
    gdd += Math.max(temp - tBase, 0);
  }
  return days;
};

// Прогнозирование дней до завершения
const estimateDaysToEnd = (currentReservoir, tBase, gddStart, gddEnd, startDayOfYear, forecastData) => {
  let reservoir = currentReservoir;
  let days = 0;
  let d = startDayOfYear;
  while (reservoir > 0 && days < 150) {
    days++;
    d++;
    let temp = getMoscowAvgTemp(d);
    let precip = 0;
    let humidity = 60;
    let wind = 3;

    if (days <= 7 && forecastData && forecastData[days - 1]) {
        const fd = forecastData[days - 1];
        if (fd.tempAvg !== undefined) temp = fd.tempAvg;
        if (fd.precip !== undefined) precip = fd.precip;
        if (fd.humidity !== undefined) humidity = fd.humidity;
        if (fd.windMax !== undefined) wind = fd.windMax;
    }

    let dailyGdd = Math.max(temp - tBase, 0);
    if (precip <= 1.0 && humidity <= 85 && dailyGdd > 0) {
        let baseDepletion = (dailyGdd / (gddEnd - gddStart)) * 100;
        let windFactor = Math.max(1, wind / 3);
        let drynessFactor = humidity < 40 ? 1.2 : 1.0;
        reservoir -= baseDepletion * windFactor * drynessFactor;
    }
  }
  return days;
};

// Эмпатичная матрица статусов (Explainable UI)
const getPollenStatus = (bioState, weather) => {
  const { hasStarted, isFinished, reservoir } = bioState;
  const isPeak = reservoir > 50;
  
  // Безопасное извлечение погодных данных
  const temp = weather?.tempMax !== undefined ? weather.tempMax : (weather?.tempAvg !== undefined ? weather.tempAvg : 15);
  const precip = weather?.precip || 0;
  const humidity = weather?.humidity || 50;
  const wind = weather?.windMax || 0;

  // 1. Критический Алерт (Высший приоритет)
  if (isPeak && precip > 1.5 && humidity > 85) {
    return { 
      badgeText: "⚡ ГРОЗОВАЯ УГРОЗА", 
      insightText: "Критическая ситуация: ливень разрушает пыльцу, превращая её в летучий микро-аллерген. Немедленно закройте окна и оставайтесь в безопасном помещении.", 
      color: "#ef4444" // text-red-500
    };
  }

  // 2. Биологические границы (Окончание / Старт)
  if (isFinished || reservoir <= 0) {
    return { 
      badgeText: "✅ МОЖНО ВЫДЫХАТЬ", 
      insightText: "Запасы пыльцы истощены, деревья отцвели. Самое сложное позади, впереди спокойное время без аллергии на этот раздражитель!", 
      color: "#10b981" // text-emerald-500
    };
  }
  if (!hasStarted) {
    return { 
      badgeText: "🌱 ДЕРЕВЬЯ СПЯТ", 
      insightText: "Для старта цветения еще не накопилось достаточно тепла. Воздух абсолютно чист, наслаждаемся весной без каких-либо ограничений.", 
      color: "#10b981" // text-emerald-500
    };
  }

  // 3. Кинетические Ингибиторы (Природа за нас)
  if (precip > 0.1) {
    return { 
      badgeText: "☔ ОЧИЩАЮЩИЙ ДОЖДЬ", 
      insightText: "Осадки отлично прибивают пыльцу к земле и промывают воздух. Наслаждаемся свежестью, пока природа делает для нас влажную уборку!", 
      color: "#0ea5e9" // text-sky-500
    };
  }
  if (humidity > 85) {
    return { 
      badgeText: "💧 ПАУЗА ИЗ-ЗА ВЛАЖНОСТИ", 
      insightText: "Сырость надежно удерживает аллерген внутри деревьев. Ловим момент чистой погоды и свободного дыхания.", 
      color: "#38bdf8" // text-sky-400
    };
  }

  // 4. Активное цветение (Риск)
  if (wind > 5 && humidity < 50) {
    return { 
      badgeText: "💨 ОПАСНЫЙ ВЕТЕР", 
      insightText: "Сухой воздух и порывистый ветер очень агрессивно разносят пыльцу. Концентрация максимальна — сегодня лучше остаться дома или использовать маску.", 
      color: "#ef4444", // text-red-500
      pulse: true
    };
  }

  // 5. Дефолт для активного сезона
  return { 
    badgeText: "⚠️ АКТИВНОЕ ПЫЛЕНИЕ", 
    insightText: (
      <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mb-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <h3 className="text-red-400 font-bold uppercase tracking-widest text-xs">Активное пыление</h3>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          Сухая и солнечная погода способствует интенсивному распространению пыльцы берёзы. Концентрация аллергена в воздухе растет. Рекомендуется ограничить время пребывания на улице и использовать барьерные средства защиты.
        </p>
      </div>
    ), 
    color: "#ef4444", // text-red-500
    pulse: true
  };
};

const SeasonProgressWidget = ({ historyData = [], forecastData = [] }) => {
  const currentYear = new Date().getFullYear();
  const currentDayOfYear = Math.floor((new Date() - new Date(currentYear, 0, 0)) / 86400000);

  // Оценка кинетического риска: Осмотический шок (Грозовая астма)
  const latest = historyData.length > 0 ? historyData[0] : null;
  let thunderstormAsthmaAlert = false;
  if (latest && latest.humidity > 85 && latest.precip > 1.0) {
    const totalPollen = (latest.alder || 0) + (latest.hazel || 0) + (latest.birch || 0);
    if (totalPollen > 50) {
      thunderstormAsthmaAlert = true;
    }
  }

  // --- ТАКСОН: ОЛЬХА + ОРЕШНИК ---
  const earlyTBase = 0.5;
  const earlyGddStart = 15;
  const earlyGddEnd = 90;

  const earlyProgress = calculateProgress(historyData, earlyTBase, earlyGddStart, earlyGddEnd, currentYear, ['alder', 'hazel']);
  const earlyMainValue = !earlyProgress.started 
    ? estimateDaysToStart(earlyProgress.gdd, earlyGddStart, earlyTBase, currentDayOfYear, forecastData)
    : (!earlyProgress.finished ? estimateDaysToEnd(earlyProgress.reservoir, earlyTBase, earlyGddStart, earlyGddEnd, currentDayOfYear, forecastData) : 0);
  const earlyIsEndingSoon = earlyProgress.started && !earlyProgress.finished && earlyMainValue < 5;

  // --- ТАКСОН: БЕРЕЗА ---
  const birchTBase = 4.0;
  const birchGddStart = 94;
  const birchGddEnd = 323;

  const birchProgress = calculateProgress(historyData, birchTBase, birchGddStart, birchGddEnd, currentYear, ['birch']);
  const birchMainValue = !birchProgress.started 
    ? estimateDaysToStart(birchProgress.gdd, birchGddStart, birchTBase, currentDayOfYear, forecastData)
    : (!birchProgress.finished ? estimateDaysToEnd(birchProgress.reservoir, birchTBase, birchGddStart, birchGddEnd, currentDayOfYear, forecastData) : 0);
  const birchIsEndingSoon = birchProgress.started && !birchProgress.finished && birchMainValue < 5;

  // Логика видимости (через 7 дней карточка полностью скрывается из DOM)
  const shouldShowEarly = !earlyProgress.finished || (currentDayOfYear - earlyProgress.finishDay <= 7);
  const shouldShowBirch = !birchProgress.finished || (currentDayOfYear - birchProgress.finishDay <= 7);

  if (!shouldShowEarly && !shouldShowBirch) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <p style={{ color: '#8e8e93', fontSize: 13, margin: 0 }}>Сезон древесной пыльцы завершен.</p>
        </motion.div>
    );
  }

  const gridTemplateColumns = '1fr'; // Заставляем карточки растягиваться на всю ширину (вертикальный стек)

  const getDaysText = (isOver, mainValue) => {
    if (isOver) return 'завершен';
    if (mainValue % 100 >= 11 && mainValue % 100 <= 19) return 'дней';
    if (mainValue % 10 === 1) return 'день';
    if (mainValue % 10 >= 2 && mainValue % 10 <= 4) return 'дня';
    return 'дней';
  };

  const renderTaxonCard = (title, progress, mainValue, daysText, pollenStatus, isEndingSoon, gddStart, gddEnd, colorGradient) => {
    const isOver = progress.finished;
    
    let percentComplete = 0;
    if (!progress.started) {
      percentComplete = Math.min(100, Math.max(0, Math.round((progress.gdd / gddStart) * 100)));
    } else {
      percentComplete = Math.max(0, Math.min(100, Math.round(100 - progress.reservoir)));
    }
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', opacity: isOver ? 0.5 : 1, transition: 'opacity 0.5s', height: '100%' }}>
        
        {/* Top 50/50 Split */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
          
          {/* Left Zone: Context */}
          <div style={{ flex: '1 1 50%', minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', justifyContent: 'flex-start' }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px 0', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              {title}
            </h2>
            <div style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 9999, marginBottom: 16 }}>
              <motion.span animate={pollenStatus.pulse ? { opacity: [1, 0.4, 1] } : {}} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: 11, fontWeight: 700, color: pollenStatus.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {pollenStatus.badgeText}
              </motion.span>
            </div>
            <div style={{ borderLeft: `2px solid ${pollenStatus.color}`, paddingLeft: 10 }}>
          <div style={{ fontSize: 13, color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                {pollenStatus.insightText}
          </div>
            </div>
          </div>
          
          {/* Right Zone: Metrics */}
          <div style={{ flex: '1 1 40%', minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', justifyContent: 'flex-start', paddingTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', margin: '0 0 8px 0' }}>
              {isOver ? 'Статус' : (progress.started ? 'Спад через' : 'Старт через')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8, marginTop: 'auto' }}>
              <span style={{ fontSize: 80, fontWeight: 700, lineHeight: 1, letterSpacing: '-2px', color: isEndingSoon ? 'var(--safe)' : '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                {isOver ? "—" : <AnimatedNumber value={mainValue} padZero={true} delay={0.4} />}
              </span>
              <span style={{ fontSize: 20, fontWeight: 500, color: '#a1a1aa', textTransform: 'lowercase' }}>
                {daysText}
              </span>
            </div>
          </div>
        </div>
  
        {/* Bottom: Progress Bar */}
        <div style={{ width: '100%', marginTop: 'auto', paddingTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8e8e93' }}>
              Прогресс сезона
            </span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, lineHeight: 1 }}>
              <AnimatedNumber value={percentComplete} />%
            </span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 9999, backgroundColor: '#27272a' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
              style={{ 
                height: '100%', borderRadius: 9999, 
                background: colorGradient
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
             <span style={{ fontSize: 10, fontWeight: 500, color: '#8e8e93' }}>GDD: <AnimatedNumber value={Math.round(progress.gdd)} /></span>
             <span style={{ fontSize: 10, fontWeight: 500, color: '#8e8e93' }}>Цель: {gddEnd}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="card"
      style={{ marginBottom: 16, padding: 16 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns, gap: 12 }}>
        {shouldShowEarly && renderTaxonCard(
          "Ольха+Орешник", earlyProgress, earlyMainValue, getDaysText(earlyProgress.finished, earlyMainValue),
          getPollenStatus({ hasStarted: earlyProgress.started, isFinished: earlyProgress.finished, reservoir: earlyProgress.reservoir }, latest),
          earlyIsEndingSoon, earlyGddStart, earlyGddEnd, 'linear-gradient(90deg, #0A84FF, #32D74B)'
        )}
        {shouldShowBirch && renderTaxonCard(
          "Берёза", birchProgress, birchMainValue, getDaysText(birchProgress.finished, birchMainValue),
          getPollenStatus({ hasStarted: birchProgress.started, isFinished: birchProgress.finished, reservoir: birchProgress.reservoir }, latest),
          birchIsEndingSoon, birchGddStart, birchGddEnd, 'linear-gradient(90deg, #fbbf24, #ef4444)'
        )}
      </div>

      {thunderstormAsthmaAlert && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255, 69, 58, 0.15)', border: '1px solid var(--critical)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ flexShrink: 0 }}><AlertTriangle color="var(--critical)" size={28} /></div>
          <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--critical)', display: 'block', marginBottom: 2, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Внимание: Осмотический шок</strong>
            Атмосферные осадки при высокой влажности провоцируют разрыв пыльцевых зерен. <b>Критический риск грозовой астмы!</b>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SeasonProgressWidget;