import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Minus, ChevronDown, AlertTriangle } from 'lucide-react';

const ALLERGENS = [
  { id: 'alder', label: 'Ольха' },
  { id: 'hazel', label: 'Орешник' },
  { id: 'birch', label: 'Береза' },
  { id: 'oak', label: 'Дуб' },
  { id: 'grass', label: 'Злаки' },
  { id: 'weed', label: 'Сорные травы' },
  { id: 'clado', label: 'Кладоспориум' },
  { id: 'alt', label: 'Альтернария' }
];

const AddDataModal = ({ isOpen, onClose, editData, onSuccess, historyData = [] }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [values, setValues] = useState({ alder: "", hazel: "", birch: "", oak: "", grass: "", weed: "", clado: "", alt: "" });
  const [saveError, setSaveError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [isWeekend, setIsWeekend] = useState(false);
  const [prevData, setPrevData] = useState(null);
  const [weather, setWeather] = useState("Загрузка...");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // При открытии окна сбрасываем ошибки и заполняем данные (если это редактирование)
  useEffect(() => {
    if (isOpen) {
      setSaveError("");
      setSaveLoading(false);
      setIsWeekend(false);
      setIsAccordionOpen(false);
      if (editData) {
        setDate(editData.date);
        setValues({
          alder: editData.alder ?? "",
          hazel: editData.hazel ?? "",
          birch: editData.birch ?? "",
          oak: editData.oak ?? "",
          grass: editData.grass ?? "",
          weed: editData.weed ?? "",
          clado: editData.clado ?? "",
          alt: editData.alt ?? ""
        });
      } else {
        setDate(todayStr);
        setValues({ alder: "", hazel: "", birch: "", oak: "", grass: "", weed: "", clado: "", alt: "" });
      }
    }
  }, [isOpen, editData, todayStr]);

  // Поиск предыдущих значений для валидации и бэйджей
  useEffect(() => {
    if (isOpen && historyData.length > 0 && date) {
      // Строго используем UTC, чтобы избежать багов со смещением в разных часовых поясах
      const targetDate = new Date(date + 'T00:00:00Z');
      targetDate.setUTCDate(targetDate.getUTCDate() - 1);
      const prevDateStr = targetDate.toISOString().split('T')[0];
      const found = historyData.find(d => d.date === prevDateStr);
      setPrevData(found || null);
    } else {
      setPrevData(null);
    }
  }, [isOpen, date, historyData]);

  // Запрос погоды (open-meteo API)
  useEffect(() => {
    if (isOpen && date) {
      setWeather("Загрузка...");
      const fetchW = async () => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62&daily=temperature_2m_max,precipitation_sum&timezone=Europe%2FMoscow&start_date=${date}&end_date=${date}`;
          const res = await fetch(url);
          const wData = await res.json();
          if (wData?.daily?.temperature_2m_max?.length > 0) {
            const temp = wData.daily.temperature_2m_max[0];
            const precip = wData.daily.precipitation_sum[0];
            setWeather(`${temp > 0 ? '+' : ''}${Math.round(temp)}°C${precip > 0 ? ', осадки: ' + precip + 'мм' : ''}`);
          } else {
            setWeather("Нет данных");
          }
        } catch(e) {
          setWeather("Ошибка API");
        }
      };
      fetchW();
    }
  }, [isOpen, date]);

  const handleValueChange = (id, val) => {
    setValues(prev => ({ ...prev, [id]: val }));
  };

  const handleWeekendToggle = (e) => {
    const checked = e.target.checked;
    setIsWeekend(checked);
    if (checked) {
      setValues({ alder: 0, hazel: 0, birch: 0, oak: 0, grass: 0, weed: 0, clado: 0, alt: 0 });
    } else {
      setValues({ alder: "", hazel: "", birch: "", oak: "", grass: "", weed: "", clado: "", alt: "" });
    }
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveLoading(true);

    if (Object.values(values).every(val => val === "")) {
      setSaveError("Введите хотя бы одно значение!");
      setSaveLoading(false);
      return;
    }

    try {
      const dataObj = {
        date,
        alder: values.alder === "" ? 0 : Number(values.alder),
        hazel: values.hazel === "" ? 0 : Number(values.hazel),
        birch: values.birch === "" ? 0 : Number(values.birch),
        oak: values.oak === "" ? 0 : Number(values.oak),
        grass: values.grass === "" ? 0 : Number(values.grass),
        weed: values.weed === "" ? 0 : Number(values.weed),
        clado: values.clado === "" ? 0 : Number(values.clado),
        alt: values.alt === "" ? 0 : Number(values.alt)
      };
      await setDoc(doc(db, 'measurements', date), dataObj);
      onSuccess();
      onClose();
    } catch (e) {
      setSaveError("Ошибка сохранения: " + (e.message || e));
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить запись за ${date.split('-').reverse().join('.')}?`)) return;
    setSaveLoading(true);
    try {
      await deleteDoc(doc(db, 'measurements', date));
      onSuccess();
      onClose();
    } catch (e) {
      setSaveError("Ошибка удаления: " + (e.message || e));
      setSaveLoading(false);
    }
  };

  // Умная сезонность для режима добавления
  const { activeAllergens, archiveAllergens } = useMemo(() => {
    if (editData) return { activeAllergens: [], archiveAllergens: [] }; // Не используется в режиме редактирования

    const month = new Date(date).getMonth() + 1;
    let seasonalKeys = [];
    if (month === 3) seasonalKeys = ['alder', 'hazel'];
    else if (month === 4) seasonalKeys = ['alder', 'hazel', 'birch'];
    else if (month === 5) seasonalKeys = ['birch', 'oak'];
    else if (month > 5 && month < 10) seasonalKeys = ['grass', 'weed', 'clado', 'alt'];
    else seasonalKeys = ['alder'];
    
    return {
      activeAllergens: ALLERGENS.filter(a => seasonalKeys.includes(a.id)),
      archiveAllergens: ALLERGENS.filter(a => !seasonalKeys.includes(a.id))
    };
  }, [date, editData]);
  
  // Фильтруем и сортируем аллергены для режима редактирования
  const allergensForEdit = useMemo(() => {
    if (!editData) return [];
    return ALLERGENS.filter(allergen => Number(editData[allergen.id]) > 0)
      .sort((a, b) => Number(editData[b.id]) - Number(editData[a.id]));
  }, [editData]);

  if (!isOpen) return null;

  const renderInput = ({ id, label }) => {
    const val = values[id];
    const prevVal = prevData ? prevData[id] : null;
    const numVal = Number(val);
    const isAlert = val !== "" && (numVal >= 500 || (prevVal > 0 && numVal >= prevVal * 10));

    return (
      <label className="allergen-input-group" key={id} style={{ display: 'block', cursor: 'default' }}>
        <div className="allergen-input-header">
          <span style={{ fontSize: 14, fontWeight: 500 }}>{label}:</span>
          {prevVal !== null && prevVal !== undefined && (
            <span className="prev-value-badge" onClick={(e) => { e.preventDefault(); if(!isWeekend) handleValueChange(id, prevVal); }}>Было: {prevVal}</span>
          )}
        </div>
        <div className="input-wrapper">
          <input
            type="number"
            className={`data-input ${isAlert ? 'amber-border' : ''}`}
            value={val}
            onChange={e => handleValueChange(id, e.target.value)}
            disabled={isWeekend}
            placeholder="0"
            style={editData ? { marginTop: 5 } : {}}
          />
          {isAlert && <AlertTriangle className="warning-icon" size={18} style={{ display: 'block' }} />}
        </div>
        {isAlert && <div className="amber-alert-text" style={{ display: 'block' }}>Внимание: значение превышает норму или в 10 раз больше вчерашнего</div>}
      </label>
    );
  };

  return (
    <div className="login-overlay" style={{ zIndex: 9998 }}>
      <div className="login-card" style={{ padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>
            {editData ? `Запись: ${date.split('-').reverse().join('.')}` : 'Внести данные'}
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }} onClick={onClose} aria-label="close-modal">
            <Minus size={24} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {!editData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, paddingBottom: 15, borderBottom: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Дата сбора:</span>
                <input type="date" className="data-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto', padding: '6px 12px', margin: 0, minHeight: 35 }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Погода (сбор):</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--safe)' }}>{weather}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Нет замеров (выходной)</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isWeekend} onChange={handleWeekendToggle} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {editData ? (
            <div id="active-allergens-container">
              {allergensForEdit.map(renderInput)}
            </div>
          ) : (
            <>
              <div id="active-allergens-container">
                {activeAllergens.map(renderInput)}
              </div>
              {archiveAllergens.length > 0 && (
                <div className="season-accordion">
                  <div className="season-header" onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
                    <span>Остальные (вне сезона)</span>
                    <ChevronDown size={18} style={{ transform: isAccordionOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                  </div>
                  <div className={`season-content ${isAccordionOpen ? 'open' : ''}`}>
                    {archiveAllergens.map(renderInput)}
                  </div>
                </div>
              )}
            </>
          )}

          {saveError && <div className="error-text show" style={{ marginTop: 10 }}>{saveError}</div>}
          
          {editData ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
              <button className="login-btn" style={{ flex: 1, padding: '12px' }} onClick={handleSave} disabled={saveLoading}>{saveLoading ? '...' : 'Сохранить'}</button>
              <button className="login-btn" style={{ flex: 1, padding: '12px', background: 'var(--critical)' }} onClick={handleDelete} disabled={saveLoading}>Удалить</button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleSave} disabled={saveLoading}>{saveLoading ? 'Сохранение...' : 'Сохранить данные'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDataModal;