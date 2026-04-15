import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import {
  Microscope, TrendingUp, Leaf, TreeDeciduous, TreePine,
  BarChart2, Calendar, Plus, DatabaseBackup, Download
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherWidget from './WeatherWidget';
import AddDataModal from './AddDataModal';
import LoginScreen from './LoginScreen';
import WeatherContextChart from './WeatherContextChart';
import { useMeasurements } from './useMeasurements';
import SeasonProgressWidget from './SeasonProgressWidget';
import { useWeather } from './useWeather';

// Регистрируем все необходимые модули Chart.js
ChartJS.register(
  CategoryScale, LinearScale, LogarithmicScale, 
  PointElement, LineElement, BarElement, 
  Title, Tooltip, Legend, Filler
);

// =========================================
// СТАТИЧНЫЕ ДАННЫЕ (ИЗ ИСХОДНОГО HTML)
// =========================================
const ARCHIVE_2026_DATA = {
  "2026-03-10": { alder: 11, hazel: null, birch: null, oak: null },
  "2026-03-11": { alder: 14, hazel: null, birch: null, oak: null },
  "2026-03-12": { alder: 26, hazel: null, birch: null, oak: null },
  "2026-03-15": { alder: 4, hazel: 7, birch: null, oak: null },
  "2026-03-16": { alder: 4, hazel: 13, birch: null, oak: null },
  "2026-03-17": { alder: 1, hazel: 3, birch: null, oak: null },
  "2026-03-18": { alder: 3, hazel: 4, birch: null, oak: null },
  "2026-03-19": { alder: 20, hazel: 78, birch: null, oak: null },
  "2026-03-22": { alder: 49, hazel: 127, birch: null, oak: null },
  "2026-03-23": { alder: 166, hazel: 201, birch: null, oak: null },
  "2026-03-24": { alder: 14, hazel: 19, birch: null, oak: null },
  "2026-03-25": { alder: 21, hazel: 32, birch: null, oak: null },
  "2026-03-26": { alder: 207, hazel: 166, birch: null, oak: null },
  "2026-03-29": { alder: 25, hazel: 29, birch: null, oak: null },
  "2026-03-30": { alder: 65, hazel: 33, birch: null, oak: null },
  "2026-03-31": { alder: 8, hazel: 2, birch: null, oak: null },
  "2026-04-01": { alder: 2, hazel: 5, birch: 1, oak: null }
};

const ARCHIVE_2025 = {
  "03-16": { alder: 0, birch: 0, oak: 0, alder_2026: 4, hazel_2026: 7 },
  "03-17": { alder: 0, birch: 0, oak: 0, alder_2026: 4, hazel_2026: 13, birch_2026: 3 },
  "03-18": { alder: 0, birch: 0, oak: 0, alder_2026: 1, hazel_2026: 3 },
  "03-19": { alder: 0, birch: 0, oak: 0, alder_2026: 20, hazel_2026: 78, birch_2026: 1 },
  "03-20": { alder: 0, birch: 0, oak: 0, alder_2026: null, hazel_2026: null },
  "03-21": { alder: 0, birch: 0, oak: 0, alder_2026: null, hazel_2026: null },
  "03-22": { alder: 0, birch: 0, oak: 0, alder_2026: 49, hazel_2026: 127, birch_2026: 1 },
  "03-23": { alder: 0, birch: 0, oak: 0, alder_2026: 166, hazel_2026: 201, birch_2026: 6 },
  "03-24": { alder: 0, birch: 0, oak: 0, alder_2026: 16, hazel_2026: 19, birch_2026: 1, alder_2023: 122, hazel_2023: 33 },
  "03-25": { alder: 0, birch: 0, oak: 0, alder_2026: 21, hazel_2026: 32, birch_2026: 1 },
  "03-26": { alder: 0, birch: 0, oak: 0, alder_2026: 207, hazel_2026: 166, birch_2026: 1 },
  "03-27": { alder: 0, birch: 0, oak: 0, alder_2026: null, hazel_2026: null, birch_2026: null },
  "03-28": { alder: 0, birch: 0, oak: 0, alder_2023: 323, hazel_2023: 1 },
  "04-01": { alder: 18, birch: 0, oak: 0 }, 
  "04-02": { alder: 226, birch: 0, oak: 0 },
  "04-03": { alder: 31, birch: 0, oak: 0 },
  "04-06": { alder: 23, birch: 0, oak: 0, alder_2023: 38, hazel_2023: 47 },
  "04-08": { alder: 6, birch: 0, oak: 0, birch_2024: 485 },
  "04-09": { alder: 28, birch: 1, oak: 0, birch_2024: 17 },
  "04-10": { alder: 2, birch: 1, oak: 0, birch_2024: 544 },
  "04-11": { alder: 0, birch: 0, oak: 0, birch_2024: 1780 },
  "04-13": { alder: 2, birch: 0, oak: 0 },
  "04-14": { alder: 13, birch: 114, oak: 0, birch_2024: 388, alder_2023: 17, hazel_2023: 21, birch_2023: 289 },
  "04-15": { alder: 1, birch: 11, oak: 0, birch_2024: 293 },
  "04-16": { alder: 0, birch: 33, oak: 0, birch_2024: 241 },
  "04-17": { alder: 4, birch: 172, oak: 0, birch_2024: 3 },
  "04-18": { alder: 0, birch: 0, oak: 0, birch_2024: 79 },
  "04-19": { alder: 0, birch: 0, oak: 0, alder_2023: 4, hazel_2023: 24, birch_2023: 732 },
  "04-20": { alder: 1, birch: 14403, oak: 0, birch_2023: 4186 },
  "04-21": { alder: 0, birch: 8310, oak: 0, birch_2024: 405, alder_2023: 6, hazel_2023: 11, birch_2023: 11206 },
  "04-22": { alder: 1, birch: 1203, oak: 0, birch_2024: 116, birch_2023: 6000 },
  "04-23": { alder: 1, birch: 3968, oak: 0, birch_2024: 144, birch_2023: 5000 },
  "04-24": { alder: 0, birch: 1700, oak: 0, alder_2023: 1, hazel_2023: 2, birch_2023: 9092 },
  "04-25": { alder: 0, birch: 0, oak: 0, birch_2024: 220 },
  "04-26": { alder: 0, birch: 0, oak: 0, birch_2024: 194 },
  "04-27": { alder: 4, birch: 389, oak: 0, birch_2023: 935 },
  "04-28": { alder: 0, birch: 150, oak: 0, alder_2023: 1, hazel_2023: 1, birch_2023: 848 },
  "04-29": { alder: 1, birch: 130, oak: 0 },
  "05-01": { alder: 0, birch: 0, oak: 0, birch_2024: 128 },
  "05-02": { alder: 0, birch: 0, oak: 0, birch_2024: 259 },
  "05-05": { alder: 0, birch: 113, oak: 0, birch_2024: 100 },
  "05-06": { alder: 0, birch: 40, oak: 0, birch_2024: 59 },
  "05-07": { alder: 0, birch: 0, oak: 0, birch_2024: 60 },
  "05-09": { alder: 0, birch: 37, oak: 0 },
  "05-10": { alder: 0, birch: 0, oak: 0, birch_2024: 27 },
  "05-11": { alder: 0, birch: 0, oak: 0, birch_2024: 10 },
  "05-12": { alder: 0, birch: 0, oak: 0, birch_2024: 10 },
  "05-13": { alder: 0, birch: 13, oak: 0, birch_2024: 10 },
  "05-14": { alder: 0, birch: 29, oak: 0 },
  "05-15": { alder: 0, birch: 30, oak: 0 },
  "05-18": { alder: 0, birch: 40, oak: 0 },
  "05-20": { alder: 0, birch: 100, oak: 0 },
  "05-21": { alder: 0, birch: 80, oak: 0 },
  "05-22": { alder: 0, birch: 140, oak: 0 },
  "05-25": { alder: 0, birch: 5, oak: 0 }
};

const WEATHER_ARCHIVE_2023 = {
  "03-01": { tempMin: -6.6, tempMax: -1.9, windDir: "СЗ", windSpeedMax: 2, precip: 0.9, snow: 36, phenomena: ["снег", "метель"], humidity: 92 },
  "03-16": { tempMin: 0.1, tempMax: 4.2, windDir: "Ю", windSpeedMax: 3, precip: 0.0, snow: 20, phenomena: [], humidity: 65 },
  "03-17": { tempMin: 1.0, tempMax: 5.5, windDir: "ЮВ", windSpeedMax: 2, precip: 1.2, snow: 18, phenomena: ["дождь"], humidity: 88 },
  "03-18": { tempMin: -2.0, tempMax: 2.1, windDir: "СЗ", windSpeedMax: 4, precip: 0.0, snow: 18, phenomena: [], humidity: 70 },
  "03-19": { tempMin: -1.0, tempMax: 6.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 15, phenomena: [], humidity: 60 },
  "03-20": { tempMin: 0.5, tempMax: 8.2, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 12, phenomena: [], humidity: 55 },
  "03-21": { tempMin: 2.0, tempMax: 10.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 8, phenomena: [], humidity: 50 },
  "03-22": { tempMin: 3.5, tempMax: 12.1, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 4, phenomena: [], humidity: 48 },
  "03-23": { tempMin: 5.0, tempMax: 14.5, windDir: "Ю", windSpeedMax: 3, precip: 2.5, snow: 0, phenomena: ["дождь"], humidity: 75 },
  "03-24": { tempMin: 4.0, tempMax: 11.0, windDir: "СЗ", windSpeedMax: 4, precip: 0.0, snow: 0, phenomena: [], humidity: 68 },
  "03-25": { tempMin: 2.0, tempMax: 9.5, windDir: "С", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 72 },
  "03-26": { tempMin: 1.0, tempMax: 8.0, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 75 },
  "03-27": { tempMin: 3.0, tempMax: 10.5, windDir: "В", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 65 },
  "03-28": { tempMin: 4.5, tempMax: 13.0, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 58 },
  "03-31": { tempMin: 2.5, tempMax: 6.6, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 70 },
  "04-01": { tempMin: 6.8, tempMax: 21.6, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 45 },
  "04-02": { tempMin: 8.0, tempMax: 18.5, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "04-03": { tempMin: 5.0, tempMax: 14.0, windDir: "СЗ", windSpeedMax: 4, precip: 1.5, snow: 0, phenomena: ["дождь"], humidity: 85 },
  "04-06": { tempMin: 3.0, tempMax: 10.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 60 },
  "04-08": { tempMin: 5.5, tempMax: 15.2, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 52 },
  "04-09": { tempMin: 7.0, tempMax: 17.5, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "04-10": { tempMin: 9.0, tempMax: 19.0, windDir: "Ю", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 48 },
  "04-11": { tempMin: 10.0, tempMax: 20.5, windDir: "ЮЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 45 },
  "04-13": { tempMin: 4.0, tempMax: 11.0, windDir: "СЗ", windSpeedMax: 5, precip: 2.0, snow: 0, phenomena: ["дождь"], humidity: 90 },
  "04-14": { tempMin: 2.0, tempMax: 9.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 70 },
  "04-15": { tempMin: 4.5, tempMax: 12.5, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 65 },
  "04-16": { tempMin: 6.0, tempMax: 15.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 60 },
  "04-17": { tempMin: 8.0, tempMax: 18.0, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "04-18": { tempMin: 10.0, tempMax: 21.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "04-19": { tempMin: 11.5, tempMax: 23.5, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 48 },
  "04-20": { tempMin: 12.0, tempMax: 24.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 46 },
  "04-21": { tempMin: 10.0, tempMax: 20.0, windDir: "СЗ", windSpeedMax: 4, precip: 5.5, snow: 0, phenomena: ["дождь", "гроза"], humidity: 80 },
  "04-22": { tempMin: 8.0, tempMax: 16.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 65 },
  "04-23": { tempMin: 9.5, tempMax: 18.5, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 58 },
  "04-24": { tempMin: 11.0, tempMax: 21.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "04-25": { tempMin: 13.0, tempMax: 23.0, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 52 },
  "04-26": { tempMin: 14.5, tempMax: 25.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "04-27": { tempMin: 15.0, tempMax: 26.5, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 48 },
  "04-28": { tempMin: 13.0, tempMax: 22.0, windDir: "З", windSpeedMax: 4, precip: 1.2, snow: 0, phenomena: ["дождь"], humidity: 75 },
  "04-29": { tempMin: 10.0, tempMax: 19.0, windDir: "СЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 68 },
  "04-30": { tempMin: 7.1, tempMax: 23.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "05-01": { tempMin: 0.1, tempMax: 10.6, windDir: "З", windSpeedMax: 3, precip: 0.2, snow: 0, phenomena: ["дождь"], humidity: 82 },
  "05-02": { tempMin: 2.0, tempMax: 12.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 70 },
  "05-05": { tempMin: 5.0, tempMax: 15.0, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 65 },
  "05-06": { tempMin: 6.0, tempMax: 16.5, windDir: "СЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 68 },
  "05-07": { tempMin: 4.5, tempMax: 14.0, windDir: "С", windSpeedMax: 3, precip: 1.0, snow: 0, phenomena: ["дождь"], humidity: 85 },
  "05-09": { tempMin: 3.0, tempMax: 12.5, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 60 },
  "05-10": { tempMin: 5.0, tempMax: 15.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 58 },
  "05-11": { tempMin: 6.5, tempMax: 18.0, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "05-12": { tempMin: 8.0, tempMax: 20.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 52 },
  "05-13": { tempMin: 10.0, tempMax: 22.5, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "05-14": { tempMin: 11.0, tempMax: 24.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 48 },
  "05-15": { tempMin: 12.5, tempMax: 25.0, windDir: "СЗ", windSpeedMax: 4, precip: 3.5, snow: 0, phenomena: ["дождь", "гроза"], humidity: 78 },
  "05-18": { tempMin: 9.0, tempMax: 19.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 60 },
  "05-20": { tempMin: 10.5, tempMax: 20.5, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 58 },
  "05-21": { tempMin: 12.0, tempMax: 22.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "05-22": { tempMin: 13.5, tempMax: 23.5, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 53 },
  "05-25": { tempMin: 15.0, tempMax: 26.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 50 },
  "05-31": { tempMin: 11.1, tempMax: 11.8, windDir: "СЗ", windSpeedMax: 2, precip: 3.0, snow: 0, phenomena: ["дождь"], humidity: 95 },
  "06-01": { tempMin: 6.0, tempMax: 21.1, windDir: "ЮВ", windSpeedMax: 1, precip: 0.0, snow: 0, phenomena: [], humidity: 60 },
  "06-30": { tempMin: 13.7, tempMax: 18.0, windDir: "СВ", windSpeedMax: 1, precip: 0.1, snow: 0, phenomena: ["дождь", "туман"], humidity: 88 },
  "07-01": { tempMin: 13.3, tempMax: 25.4, windDir: "З", windSpeedMax: 2, precip: 0.4, snow: 0, phenomena: ["дождь"], humidity: 75 },
  "07-31": { tempMin: 13.5, tempMax: 24.0, windDir: "С", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 65 },
  "08-01": { tempMin: 15.1, tempMax: 26.4, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 62 },
  "08-31": { tempMin: 14.8, tempMax: 25.4, windDir: "штиль", windSpeedMax: 0, precip: 0.0, snow: 0, phenomena: [], humidity: 68 },
  "09-01": { tempMin: 14.4, tempMax: 26.9, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 70 },
  "09-30": { tempMin: 12.4, tempMax: 25.2, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 72 }
};

const WEATHER_ARCHIVE_2024 = {
  "03-01": { tempMin: 0.6, tempMax: 4.6, windDir: "В", windSpeedMax: 1, precip: 0.0, snow: 57, phenomena: ["дымка"], humidity: 70 },
  "03-16": { tempMin: 1.0, tempMax: 6.5, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 30, phenomena: [], humidity: 59 },
  "03-17": { tempMin: 2.5, tempMax: 8.0, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 25, phenomena: [], humidity: 65 },
  "03-18": { tempMin: 3.0, tempMax: 9.5, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 20, phenomena: [], humidity: 76 },
  "03-19": { tempMin: 1.5, tempMax: 7.0, windDir: "СЗ", windSpeedMax: 4, precip: 1.0, snow: 18, phenomena: ["дождь"], humidity: 77 },
  "03-20": { tempMin: 0.0, tempMax: 5.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 15, phenomena: [], humidity: 36 },
  "03-21": { tempMin: -1.0, tempMax: 4.5, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 15, phenomena: [], humidity: 21 },
  "03-22": { tempMin: 0.5, tempMax: 6.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 12, phenomena: [], humidity: 34 },
  "03-23": { tempMin: 2.0, tempMax: 8.5, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 10, phenomena: [], humidity: 89 },
  "03-24": { tempMin: 4.0, tempMax: 11.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 8, phenomena: [], humidity: 93 },
  "03-25": { tempMin: 5.5, tempMax: 13.5, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 4, phenomena: [], humidity: 59 },
  "03-26": { tempMin: 6.0, tempMax: 15.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 47 },
  "03-27": { tempMin: 4.5, tempMax: 12.0, windDir: "СЗ", windSpeedMax: 4, precip: 2.5, snow: 0, phenomena: ["дождь"], humidity: 39 },
  "03-28": { tempMin: 2.0, tempMax: 9.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 37 },
  "03-31": { tempMin: 3.0, tempMax: 16.7, windDir: "ЮВ", windSpeedMax: 1, precip: 0.7, snow: 8, phenomena: ["дымка"], humidity: 69 },
  "04-01": { tempMin: 8.7, tempMax: 21.6, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 30 },
  "04-02": { tempMin: 10.0, tempMax: 23.5, windDir: "Ю", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 42 },
  "04-03": { tempMin: 7.0, tempMax: 15.0, windDir: "СЗ", windSpeedMax: 5, precip: 2.1, snow: 0, phenomena: ["дождь"], humidity: 74 },
  "04-06": { tempMin: 2.0, tempMax: 8.0, windDir: "С", windSpeedMax: 4, precip: 1.5, snow: 0, phenomena: ["дождь"], humidity: 66 },
  "04-08": { tempMin: 5.0, tempMax: 14.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 61 },
  "04-09": { tempMin: 8.0, tempMax: 18.0, windDir: "ЮЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 62 },
  "04-10": { tempMin: 11.0, tempMax: 22.0, windDir: "Ю", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 62 },
  "04-11": { tempMin: 10.2, tempMax: 16.9, windDir: "З", windSpeedMax: 1, precip: 0.3, snow: 0, phenomena: ["дождь"], humidity: 44 },
  "04-13": { tempMin: 6.0, tempMax: 13.0, windDir: "СЗ", windSpeedMax: 4, precip: 0.0, snow: 0, phenomena: [], humidity: 77 },
  "04-14": { tempMin: 8.0, tempMax: 16.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 80 },
  "04-15": { tempMin: 7.0, tempMax: 14.0, windDir: "СЗ", windSpeedMax: 3, precip: 5.0, snow: 0, phenomena: ["дождь"], humidity: 59 },
  "04-16": { tempMin: 5.0, tempMax: 13.0, windDir: "С", windSpeedMax: 4, precip: 0.0, snow: 0, phenomena: [], humidity: 72 },
  "04-17": { tempMin: 4.0, tempMax: 12.0, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 59 },
  "04-18": { tempMin: 6.0, tempMax: 15.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 86 },
  "04-19": { tempMin: 8.0, tempMax: 17.0, windDir: "ЮВ", windSpeedMax: 3, precip: 8.0, snow: 0, phenomena: ["дождь", "гроза"], humidity: 68 },
  "04-20": { tempMin: 10.0, tempMax: 20.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 88 },
  "04-21": { tempMin: 12.0, tempMax: 24.0, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 80 },
  "04-22": { tempMin: 14.0, tempMax: 26.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 46 },
  "04-23": { tempMin: 11.0, tempMax: 20.0, windDir: "СЗ", windSpeedMax: 4, precip: 1.2, snow: 0, phenomena: ["дождь"], humidity: 68 },
  "04-24": { tempMin: 9.0, tempMax: 18.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 59 },
  "04-25": { tempMin: 10.0, tempMax: 19.0, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 44 },
  "04-26": { tempMin: 12.0, tempMax: 22.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 88 },
  "04-27": { tempMin: 14.0, tempMax: 24.0, windDir: "ЮВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 90 },
  "04-28": { tempMin: 15.0, tempMax: 26.0, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 40 },
  "04-29": { tempMin: 16.0, tempMax: 27.0, windDir: "ЮЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 29 },
  "04-30": { tempMin: 10.4, tempMax: 23.0, windDir: "СЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 34 },
  "05-01": { tempMin: 11.8, tempMax: 15.4, windDir: "СЗ", windSpeedMax: 2, precip: 0.5, snow: 0, phenomena: ["дождь"], humidity: 29 },
  "05-02": { tempMin: 9.0, tempMax: 14.0, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 47 },
  "05-05": { tempMin: 5.0, tempMax: 10.0, windDir: "СВ", windSpeedMax: 4, precip: 2.5, snow: 0, phenomena: ["дождь"], humidity: 52 },
  "05-06": { tempMin: 2.0, tempMax: 8.5, windDir: "С", windSpeedMax: 3, precip: 1.0, snow: 0, phenomena: ["дождь"], humidity: 58 },
  "05-07": { tempMin: 1.0, tempMax: 6.0, windDir: "СЗ", windSpeedMax: 4, precip: 0.0, snow: 0, phenomena: [], humidity: 90 },
  "05-09": { tempMin: 0.1, tempMax: 3.6, windDir: "СВ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: ["снег"], humidity: 41 },
  "05-10": { tempMin: 2.0, tempMax: 8.0, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 42 },
  "05-11": { tempMin: 3.5, tempMax: 11.0, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 35 },
  "05-12": { tempMin: 5.0, tempMax: 13.5, windDir: "Ю", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 52 },
  "05-13": { tempMin: 7.0, tempMax: 16.0, windDir: "ЮЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 42 },
  "05-14": { tempMin: 8.5, tempMax: 19.0, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 44 },
  "05-15": { tempMin: 10.0, tempMax: 21.0, windDir: "СЗ", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 38 },
  "05-18": { tempMin: 11.5, tempMax: 23.5, windDir: "С", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 29 },
  "05-20": { tempMin: 13.0, tempMax: 25.0, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 31 },
  "05-21": { tempMin: 14.0, tempMax: 26.5, windDir: "В", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: [], humidity: 40 },
  "05-22": { tempMin: 15.5, tempMax: 28.0, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 25 },
  "05-25": { tempMin: 14.0, tempMax: 24.0, windDir: "Ю", windSpeedMax: 4, precip: 12.5, snow: 0, phenomena: ["дождь", "гроза"], humidity: 23 },
  "05-31": { tempMin: 16.1, tempMax: 30.5, windDir: "штиль", windSpeedMax: 0, precip: 0.0, snow: 0, phenomena: [], humidity: 30 },
  "06-01": { tempMin: 15.0, tempMax: 30.3, windDir: "В", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 48 },
  "06-06": { tempMin: 14.4, tempMax: 26.6, windDir: "СВ", windSpeedMax: 2, precip: 53.0, snow: 0, phenomena: ["гроза"], humidity: 99 },
  "07-04": { tempMin: 19.7, tempMax: 33.5, windDir: "В", windSpeedMax: 2, precip: 0.2, snow: 0, phenomena: ["гроза"], humidity: 70 },
  "08-01": { tempMin: 14.1, tempMax: 21.1, windDir: "штиль", windSpeedMax: 0, precip: 0.4, snow: 0, phenomena: ["ливневой дождь"], humidity: 85 },
  "08-31": { tempMin: 17.4, tempMax: 25.4, windDir: "штиль", windSpeedMax: 0, precip: 0.0, snow: 0, phenomena: [], humidity: 65 }
};

const WEATHER_ARCHIVE_2025 = {
  "03-01": { tempMin: -2.6, tempMax: 4.9, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 75 },
  "03-02": { tempMin: -2.6, tempMax: 4.7, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 76 },
  "03-03": { tempMin: -1.0, tempMax: 4.9, windSpeedMax: 2, precip: 0.4, windDir: "СЗ", phenomena: ["снег"], humidity: 90 },
  "03-04": { tempMin: -2.0, tempMax: 1.4, windSpeedMax: 1, precip: 0.5, windDir: "ЮЗ", phenomena: ["снег"], humidity: 92 },
  "03-05": { tempMin: -0.7, tempMax: 2.2, windSpeedMax: 2, precip: 0.2, windDir: "Ю", humidity: 88 },
  "03-06": { tempMin: 0.0, tempMax: 3.5, windSpeedMax: 3, precip: 1.0, windDir: "З", phenomena: ["дождь"], humidity: 85 },
  "03-07": { tempMin: -4.4, tempMax: 3.1, windSpeedMax: 2, precip: 2.0, windDir: "СЗ", phenomena: ["дождь"], humidity: 89 },
  "03-08": { tempMin: -3.4, tempMax: 6.9, windSpeedMax: 2, precip: 0.0, windDir: "З", humidity: 70 },
  "03-09": { tempMin: 1.0, tempMax: 6.4, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 68 },
  "03-10": { tempMin: -3.0, tempMax: 4.1, windSpeedMax: 4, precip: 0.0, windDir: "СЗ", humidity: 72 },
  "03-11": { tempMin: -7.0, tempMax: 2.5, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 78 },
  "03-12": { tempMin: -8.9, tempMax: 0.0, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 80 },
  "03-13": { tempMin: -10.4, tempMax: 4.6, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 75 },
  "03-14": { tempMin: -12.4, tempMax: 4.7, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 77 },
  "03-15": { tempMin: -6.4, tempMax: 2.4, windSpeedMax: 2, precip: 0.2, windDir: "ЮЗ", phenomena: ["снег"], humidity: 91 },
  "03-16": { tempMin: -4.0, tempMax: 4.4, windSpeedMax: 2, precip: 0.6, windDir: "З", phenomena: ["ливневой дождь"], humidity: 87 },
  "03-17": { tempMin: -4.8, tempMax: 8.7, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 65 },
  "03-18": { tempMin: -1.9, tempMax: 9.9, windSpeedMax: 2, precip: 0.0, windDir: "С", humidity: 63 },
  "03-19": { tempMin: -3.6, tempMax: 10.0, windSpeedMax: 2, precip: 0.0, windDir: "СВ", humidity: 60 },
  "03-20": { tempMin: -12.5, tempMax: 3.2, windSpeedMax: 2, precip: 0.0, windDir: "СВ", humidity: 75 },
  "03-21": { tempMin: -14.5, tempMax: 5.0, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ", humidity: 78 },
  "03-22": { tempMin: -7.1, tempMax: 10.7, windSpeedMax: 3, precip: 0.0, windDir: "Ю", humidity: 60 },
  "03-23": { tempMin: 2.0, tempMax: 6.1, windSpeedMax: 3, precip: 1.0, windDir: "ЮВ", phenomena: ["дождь"], humidity: 82 },
  "03-24": { tempMin: 0.4, tempMax: 3.9, windSpeedMax: 1, precip: 0.3, windDir: "С", humidity: 85 },
  "03-25": { tempMin: 0.9, tempMax: 6.8, windSpeedMax: 1, precip: 0.0, windDir: "Ю", humidity: 70 },
  "03-26": { tempMin: 4.0, tempMax: 9.5, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 68 },
  "03-27": { tempMin: 3.4, tempMax: 9.5, windSpeedMax: 2, precip: 0.0, windDir: "С", humidity: 69 },
  "03-28": { tempMin: 1.8, tempMax: 11.7, windSpeedMax: 1, precip: 0.0, windDir: "Ю", humidity: 65 },
  "03-29": { tempMin: 0.5, tempMax: 14.4, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 62 },
  "03-30": { tempMin: 0.2, tempMax: 15.9, windSpeedMax: 2, precip: 0.0, windDir: "З", humidity: 60 },
  "03-31": { tempMin: -5.0, tempMax: 16.6, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 64 },
  "04-01": { tempMin: 1.4, tempMax: 8.5, windSpeedMax: 2, precip: 0.1, windDir: "СВ", phenomena: ["дождь"], humidity: 80 },
  "04-02": { tempMin: -2.8, tempMax: 13.7, windSpeedMax: 3, precip: 6.0, windDir: "С", phenomena: ["ливневой дождь"], humidity: 95 },
  "04-03": { tempMin: -3.4, tempMax: 17.5, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 60 },
  "04-04": { tempMin: -6.5, tempMax: 6.9, windSpeedMax: 4, precip: 3.0, windDir: "СВ", phenomena: ["сильн. снег"], humidity: 98 },
  "04-05": { tempMin: -4.1, tempMax: 2.4, windSpeedMax: 2, precip: 0.0, windDir: "СВ", humidity: 80 },
  "04-06": { tempMin: -2.8, tempMax: 1.5, windSpeedMax: 3, precip: 0.5, windDir: "С", phenomena: ["снег"], humidity: 96 },
  "04-07": { tempMin: -5.4, tempMax: 5.1, windSpeedMax: 3, precip: 0.0, windDir: "З", humidity: 75 },
  "04-08": { tempMin: -10.3, tempMax: 10.8, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 65 },
  "04-09": { tempMin: -1.9, tempMax: 10.0, windSpeedMax: 2, precip: 0.5, windDir: "З", phenomena: ["снег"], humidity: 90 },
  "04-10": { tempMin: -2.3, tempMax: 12.9, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 62 },
  "04-11": { tempMin: 2.0, tempMax: 26.0, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 45 },
  "04-12": { tempMin: 0.9, tempMax: 17.3, windSpeedMax: 1, precip: 0.0, windDir: "штиль", humidity: 55 },
  "04-13": { tempMin: 5.0, tempMax: 19.0, windSpeedMax: 2, precip: 0.3, windDir: "ЮЗ", phenomena: ["дождь"], humidity: 78 },
  "04-14": { tempMin: 8.2, tempMax: 24.1, windSpeedMax: 2, precip: 0.0, windDir: "штиль", humidity: 50 },
  "04-15": { tempMin: 4.9, tempMax: 26.0, windSpeedMax: 2, precip: 0.0, windDir: "З", humidity: 48 },
  "04-16": { tempMin: 1.7, tempMax: 10.0, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 65 },
  "04-17": { tempMin: 1.0, tempMax: 25.9, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 47 },
  "04-18": { tempMin: 5.8, tempMax: 23.4, windSpeedMax: 1, precip: 0.0, windDir: "СВ", humidity: 52 },
  "04-19": { tempMin: 7.0, tempMax: 17.6, windSpeedMax: 1, precip: 0.0, windDir: "ЮВ", humidity: 58 },
  "04-20": { tempMin: 3.7, tempMax: 25.8, windSpeedMax: 2, precip: 0.6, windDir: "СЗ", phenomena: ["ливневой дождь"], humidity: 82 },
  "04-21": { tempMin: 4.5, tempMax: 18.6, windSpeedMax: 2, precip: 0.0, windDir: "В", humidity: 60 },
  "04-22": { tempMin: 3.6, tempMax: 9.7, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ", humidity: 68 },
  "04-23": { tempMin: 2.8, tempMax: 17.6, windSpeedMax: 3, precip: 0.7, windDir: "СЗ", phenomena: ["дождь"], humidity: 85 },
  "04-24": { tempMin: -2.5, tempMax: 1.8, windSpeedMax: 4, precip: 0.1, windDir: "СЗ", phenomena: ["крупа", "снег"], humidity: 97 },
  "04-25": { tempMin: -7.8, tempMax: 5.4, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 78 },
  "04-26": { tempMin: -10.4, tempMax: 9.6, windSpeedMax: 2, precip: 0.0, windDir: "З", humidity: 70 },
  "04-27": { tempMin: -4.0, tempMax: 11.0, windSpeedMax: 1, precip: 0.0, windDir: "З", humidity: 65 },
  "04-28": { tempMin: 2.4, tempMax: 10.5, windSpeedMax: 3, precip: 3.0, windDir: "З", phenomena: ["ливневой дождь"], humidity: 90 },
  "04-29": { tempMin: 4.4, tempMax: 10.8, windSpeedMax: 2, precip: 0.7, windDir: "СЗ", phenomena: ["дождь"], humidity: 88 },
  "04-30": { tempMin: -0.5, tempMax: 7.5, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 75 },
  "05-01": { tempMin: 5.0, tempMax: 13.7, windSpeedMax: 3, precip: 8.0, windDir: "С", phenomena: ["ливневой дождь", "дождь"], humidity: 95 },
  "05-02": { tempMin: 5.6, tempMax: 13.7, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 70 },
  "05-03": { tempMin: 4.1, tempMax: 16.4, windSpeedMax: 3, precip: 0.0, windDir: "З", humidity: 65 },
  "05-04": { tempMin: 2.6, tempMax: 5.8, windSpeedMax: 3, precip: 0.0, windDir: "С", humidity: 72 },
  "05-05": { tempMin: -2.8, tempMax: 7.4, windSpeedMax: 4, precip: 0.0, windDir: "СВ", phenomena: ["снег", "позёмок"], humidity: 92 },
  "05-06": { tempMin: -2.8, tempMax: 2.4, windSpeedMax: 2, precip: 0.0, windDir: "СВ", phenomena: ["ливневой снег", "снег"], humidity: 96 },
  "05-07": { tempMin: -1.3, tempMax: 1.5, windSpeedMax: 3, precip: 6.0, windDir: "СЗ", phenomena: ["сильн. снег"], humidity: 98 },
  "05-08": { tempMin: -2.7, tempMax: 4.9, windSpeedMax: 3, precip: 2.0, windDir: "З", phenomena: ["ливневой снег"], humidity: 97 },
  "05-09": { tempMin: -0.7, tempMax: 4.3, windSpeedMax: 2, precip: 1.0, windDir: "Ю", phenomena: ["ливневой снег", "снег"], humidity: 95 },
  "05-10": { tempMin: 0.7, tempMax: 4.1, windSpeedMax: 2, precip: 0.0, windDir: "З", humidity: 80 },
  "05-11": { tempMin: -3.4, tempMax: 5.1, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 75 },
  "05-12": { tempMin: -0.3, tempMax: 9.4, windSpeedMax: 3, precip: 1.0, windDir: "СЗ", phenomena: ["снег"], humidity: 94 },
  "05-13": { tempMin: -0.6, tempMax: 12.4, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 70 },
  "05-14": { tempMin: 6.3, tempMax: 21.7, windSpeedMax: 3, precip: 0.0, windDir: "ЮЗ", humidity: 55 },
  "05-15": { tempMin: 9.6, tempMax: 15.5, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ", humidity: 60 },
  "05-16": { tempMin: 8.5, tempMax: 13.6, windSpeedMax: 3, precip: 0.0, windDir: "Ю", humidity: 62 },
  "05-17": { tempMin: -2.6, tempMax: 4.6, windSpeedMax: 4, precip: 4.0, windDir: "СЗ", phenomena: ["ливневой снег"], humidity: 98 },
  "05-18": { tempMin: -7.5, tempMax: 2.5, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", phenomena: ["крупа", "снег"], humidity: 97 },
  "05-19": { tempMin: -5.2, tempMax: 10.2, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 70 },
  "05-20": { tempMin: -1.5, tempMax: 11.0, windSpeedMax: 2, precip: 2.0, windDir: "З", phenomena: ["ливневой дождь"], humidity: 88 },
  "05-21": { tempMin: 1.4, tempMax: 8.4, windSpeedMax: 2, precip: 2.0, windDir: "СЗ", phenomena: ["ливневой дождь"], humidity: 90 },
  "05-22": { tempMin: 4.3, tempMax: 13.1, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 72 },
  "05-23": { tempMin: 3.1, tempMax: 17.5, windSpeedMax: 3, precip: 0.0, windDir: "СВ", humidity: 65 },
  "05-24": { tempMin: -0.2, tempMax: 13.1, windSpeedMax: 3, precip: 0.0, windDir: "З", humidity: 68 },
  "05-25": { tempMin: 6.1, tempMax: 13.3, windSpeedMax: 3, precip: 5.0, windDir: "ЮЗ", phenomena: ["ливневой дождь", "дождь"], humidity: 92 },
  "05-26": { tempMin: 4.2, tempMax: 14.4, windSpeedMax: 2, precip: 0.0, windDir: "С", humidity: 70 },
  "05-27": { tempMin: -0.6, tempMax: 22.1, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 55 },
  "05-28": { tempMin: 12.9, tempMax: 26.1, windSpeedMax: 3, precip: 0.0, windDir: "Ю", humidity: 50 },
  "05-29": { tempMin: 10.0, tempMax: 25.6, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 52 },
  "05-30": { tempMin: 8.6, tempMax: 26.8, windSpeedMax: 3, precip: 0.0, windDir: "ЮВ", humidity: 50 },
  "05-31": { tempMin: 13.6, tempMax: 28.9, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ", humidity: 48 },
  "06-01": { tempMin: 13.4, tempMax: 20.0, windSpeedMax: 3, precip: 0.1, windDir: "СЗ", phenomena: ["ливневой дождь"], humidity: 75 },
  "06-02": { tempMin: 9.9, tempMax: 21.8, windSpeedMax: 2, precip: 0.6, windDir: "СЗ", humidity: 80 },
  "06-03": { tempMin: 15.4, tempMax: 22.3, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 65 },
  "06-04": { tempMin: 14.7, tempMax: 22.0, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 68 },
  "06-05": { tempMin: 13.6, tempMax: 24.0, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 66 },
  "06-06": { tempMin: 16.1, tempMax: 24.8, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ", humidity: 64 },
  "06-07": { tempMin: 17.1, tempMax: 26.8, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 62 },
  "06-08": { tempMin: 17.4, tempMax: 26.7, windSpeedMax: 3, precip: 11.0, windDir: "З", phenomena: ["гроза", "ливневой дождь"], humidity: 95 },
  "06-09": { tempMin: 17.5, tempMax: 27.2, windSpeedMax: 2, precip: 0.2, windDir: "ЮЗ", phenomena: ["ливневой дождь"], humidity: 85 },
  "06-10": { tempMin: 12.8, tempMax: 19.9, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 70 },
  "06-11": { tempMin: 11.2, tempMax: 19.3, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 72 },
  "06-12": { tempMin: 13.1, tempMax: 20.9, windSpeedMax: 2, precip: 0.0, windDir: "штиль", humidity: 75 },
  "06-13": { tempMin: 14.1, tempMax: 20.5, windSpeedMax: 3, precip: 2.0, windDir: "В", phenomena: ["ливневой дождь"], humidity: 88 },
  "06-14": { tempMin: 13.1, tempMax: 17.0, windSpeedMax: 3, precip: 8.0, windDir: "С", phenomena: ["ливневой дождь"], humidity: 94 },
  "06-15": { tempMin: 13.0, tempMax: 16.8, windSpeedMax: 3, precip: 5.0, windDir: "СЗ", phenomena: ["дождь"], humidity: 92 },
  "06-16": { tempMin: 14.2, tempMax: 24.7, windSpeedMax: 2, precip: 0.0, windDir: "С", humidity: 70 },
  "06-17": { tempMin: 14.7, tempMax: 22.2, windSpeedMax: 2, precip: 1.0, windDir: "ЮВ", phenomena: ["ливневой дождь"], humidity: 85 },
  "06-18": { tempMin: 14.5, tempMax: 18.9, windSpeedMax: 2, precip: 1.0, windDir: "штиль", phenomena: ["дождь"], humidity: 88 },
  "06-19": { tempMin: 12.1, tempMax: 17.5, windSpeedMax: 3, precip: 2.0, windDir: "СЗ", phenomena: ["ливневой дождь"], humidity: 90 },
  "06-20": { tempMin: 11.0, tempMax: 14.2, windSpeedMax: 3, precip: 12.0, windDir: "СЗ", phenomena: ["дождь", "ливневой дождь"], humidity: 96 },
  "06-21": { tempMin: 8.2, tempMax: 16.9, windSpeedMax: 3, precip: 0.2, windDir: "СЗ", humidity: 85 },
  "06-22": { tempMin: 12.7, tempMax: 17.6, windSpeedMax: 2, precip: 0.0, windDir: "штиль", humidity: 75 },
  "06-23": { tempMin: 10.1, tempMax: 19.6, windSpeedMax: 2, precip: 0.0, windDir: "СВ", humidity: 72 },
  "06-24": { tempMin: 13.9, tempMax: 21.8, windSpeedMax: 2, precip: 0.8, windDir: "Ю", phenomena: ["ливневой дождь"], humidity: 84 },
  "06-25": { tempMin: 14.1, tempMax: 19.5, windSpeedMax: 3, precip: 3.0, windDir: "ЮЗ", phenomena: ["ливневой дождь"], humidity: 89 },
  "06-26": { tempMin: 11.8, tempMax: 19.1, windSpeedMax: 3, precip: 0.0, windDir: "СЗ", humidity: 75 },
  "06-27": { tempMin: 10.8, tempMax: 20.4, windSpeedMax: 2, precip: 0.0, windDir: "СЗ", humidity: 70 },
  "06-28": { tempMin: 13.2, tempMax: 22.8, windSpeedMax: 2, precip: 0.0, windDir: "ЮЗ", humidity: 68 },
  "06-29": { tempMin: 15.0, tempMax: 24.3, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 65 },
  "06-30": { tempMin: 16.4, tempMax: 25.1, windSpeedMax: 2, precip: 0.0, windDir: "Ю", humidity: 64 }
};

const WEATHER_ARCHIVE_2026 = {
  "03-01": { tempMin: 1.2, tempMax: 4.9, windDir: "З", windSpeedMax: 1, precip: 0.0, snow: 61, phenomena: ["дождь", "дымка"], humidity: 95 },
  "03-02": { tempMin: 0.4, tempMax: 3.8, windDir: "СЗ", windSpeedMax: 2, precip: 1.0, snow: 54, phenomena: ["дождь", "снег", "дымка"], humidity: 94 },
  "03-03": { tempMin: 0.2, tempMax: 1.8, windDir: "СЗ", windSpeedMax: 2, precip: 6.6, snow: 52, phenomena: ["снег", "дождь"], humidity: 81 },
  "03-04": { tempMin: -2.1, tempMax: 1.0, windDir: "Ю", windSpeedMax: 1, precip: 2.0, snow: 51, phenomena: ["снег"], humidity: 84 },
  "03-05": { tempMin: 0.3, tempMax: 2.2, windDir: "СЗ", windSpeedMax: 2, precip: 1.6, snow: 50, phenomena: ["снег"], humidity: 88 },
  "03-06": { tempMin: -5.3, tempMax: 0.1, windDir: "С", windSpeedMax: 2, precip: 0.0, snow: 47, phenomena: [], humidity: 77 },
  "03-07": { tempMin: -3.7, tempMax: 3.4, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 47, phenomena: [], humidity: 74 },
  "03-08": { tempMin: -1.5, tempMax: 4.1, windDir: "СЗ", windSpeedMax: 2, precip: 0.6, snow: 46, phenomena: ["снег"], humidity: 72 },
  "03-09": { tempMin: -6.3, tempMax: 1.7, windDir: "ЮВ", windSpeedMax: 1, precip: 1.8, snow: 47, phenomena: ["снег", "дымка"], humidity: 79 },
  "03-10": { tempMin: 0.1, tempMax: 9.4, windDir: "З", windSpeedMax: 1, precip: 0.0, snow: 46, phenomena: [], humidity: 63 },
  "03-11": { tempMin: -1.0, tempMax: 12.2, windDir: "Ю", windSpeedMax: 1, precip: 0.0, snow: 44, phenomena: [], humidity: 59 },
  "03-12": { tempMin: 3.0, tempMax: 12.6, windDir: "ЮЗ", windSpeedMax: 1, precip: 0.0, snow: 40, phenomena: [], humidity: 65 },
  "03-13": { tempMin: 2.7, tempMax: 13.8, windDir: "Ю", windSpeedMax: 1, precip: 0.0, snow: 39, phenomena: ["дождь"], humidity: 58 },
  "03-14": { tempMin: -0.7, tempMax: 12.9, windDir: "ЮВ", windSpeedMax: 1, precip: 0.0, snow: 37, phenomena: [], humidity: 58 },
  "03-15": { tempMin: 0.0, tempMax: 10.5, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 35, phenomena: [], humidity: 54 },
  "03-16": { tempMin: -2.7, tempMax: 9.4, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 33, phenomena: [], humidity: 63 },
  "03-17": { tempMin: -2.4, tempMax: 10.5, windDir: "В", windSpeedMax: 1, precip: 0.0, snow: 30, phenomena: [], humidity: 59 },
  "03-18": { tempMin: 0.1, tempMax: 11.0, windDir: "СВ", windSpeedMax: 1, precip: 0.0, snow: 29, phenomena: [], humidity: 54 },
  "03-19": { tempMin: -2.5, tempMax: 11.6, windDir: "З", windSpeedMax: 1, precip: 0.0, snow: 27, phenomena: [], humidity: 56 },
  "03-20": { tempMin: 0.1, tempMax: 10.9, windDir: "СЗ", windSpeedMax: 1, precip: 0.0, snow: 24, phenomena: ["дымка"], humidity: 63 },
  "03-21": { tempMin: 1.8, tempMax: 9.2, windDir: "СВ", windSpeedMax: 1, precip: 0.0, snow: 23, phenomena: [], humidity: 65 },
  "03-22": { tempMin: -1.6, tempMax: 11.7, windDir: "З", windSpeedMax: 1, precip: 0.0, snow: 20, phenomena: [], humidity: 57 },
  "03-23": { tempMin: -1.3, tempMax: 13.1, windDir: "З", windSpeedMax: 1, precip: 0.0, snow: 18, phenomena: [], humidity: 55 },
  "03-24": { tempMin: 1.1, tempMax: 12.9, windDir: "СЗ", windSpeedMax: 1, precip: 0.0, snow: 16, phenomena: [], humidity: 52 },
  "03-25": { tempMin: -0.5, tempMax: 13.2, windDir: "ЮВ", windSpeedMax: 1, precip: 0.0, snow: 13, phenomena: [], humidity: 53 },
  "03-26": { tempMin: 0.6, tempMax: 12.2, windDir: "ЮВ", windSpeedMax: 2, precip: 0.0, snow: 12, phenomena: ["мгла"], humidity: 56 },
  "03-27": { tempMin: 0.7, tempMax: 14.5, windDir: "В", windSpeedMax: 1, precip: 0.0, snow: 9, phenomena: [], humidity: 63 },
  "03-28": { tempMin: 4.1, tempMax: 14.3, windDir: "СВ", windSpeedMax: 1, precip: 0.0, snow: 7, phenomena: [], humidity: 57 },
  "03-29": { tempMin: 5.9, tempMax: 17.3, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 3, phenomena: [], humidity: 54 },
  "03-30": { tempMin: 2.6, tempMax: 17.1, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 53 },
  "03-31": { tempMin: 6.3, tempMax: 17.6, windDir: "СВ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 55 },
  "04-01": { tempMin: 6.7, tempMax: 17.1, windDir: "С", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 56 },
  "04-02": { tempMin: 7.0, tempMax: 10.0, windDir: "СЗ", windSpeedMax: 2, precip: 0.6, snow: 0, phenomena: ["дождь"], humidity: 74 },
  "04-03": { tempMin: 6.2, tempMax: 15.5, windDir: "З", windSpeedMax: 2, precip: 1.0, snow: 0, phenomena: ["дождь"], humidity: 54 },
  "04-04": { tempMin: 2.1, tempMax: 15.1, windDir: "Ю", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 46 },
  "04-05": { tempMin: 3.4, tempMax: 8.3, windDir: "З", windSpeedMax: 2, precip: 5.8, snow: 0, phenomena: ["дождь", "крупа", "снег"], humidity: 78 },
  "04-06": { tempMin: 1.3, tempMax: 8.5, windDir: "ЮВ", windSpeedMax: 2, precip: 2.2, snow: 0, phenomena: ["дождь"], humidity: 80 },
  "04-07": { tempMin: 1.0, tempMax: 7.7, windDir: "З", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: ["дымка", "дождь"], humidity: 80 },
  "04-08": { tempMin: 2.1, tempMax: 5.8, windDir: "СЗ", windSpeedMax: 2, precip: 0.4, snow: 0, phenomena: ["дождь"], humidity: 81 },
  "04-09": { tempMin: 0.1, tempMax: 3.5, windDir: "С", windSpeedMax: 4, precip: 5.0, snow: 0, phenomena: ["дождь", "снег"], humidity: 91 },
  "04-10": { tempMin: -0.3, tempMax: 4.7, windDir: "СВ", windSpeedMax: 3, precip: 1.6, snow: 2, phenomena: ["снег", "дождь"], humidity: 81 },
  "04-11": { tempMin: 3.2, tempMax: 5.3, windDir: "В", windSpeedMax: 2, precip: 2.2, snow: 0, phenomena: ["дождь", "дымка"], humidity: 89 },
  "04-12": { tempMin: 4.3, tempMax: 11.8, windDir: "СВ", windSpeedMax: 1, precip: 0.2, snow: 0, phenomena: ["дымка"], humidity: 75 },
  "04-13": { tempMin: 0.8, tempMax: 12.3, windDir: "С", windSpeedMax: 3, precip: 0.0, snow: 0, phenomena: ["дымка"], humidity: 63 },
  "04-14": { tempMin: 6.4, tempMax: 7.7, windDir: "СЗ", windSpeedMax: 2, precip: 0.0, snow: 0, phenomena: [], humidity: 46 }
};

const STATIC_SUMMARY = [
  { year: 2026, status: "Март: Ольха активна (220)", level: "high" },
  { year: 2025, status: "Пик березы 20 апр (14403)", level: "critical" },
  { year: 2024, status: "Умеренный фон", level: "warning" },
  { year: 2023, status: "Пик березы 21 апр (11206)", level: "critical" }
];

const colorMap = { 'safe': '#32D74B', 'warning': '#FFD60A', 'high': '#FF9F0A', 'critical': '#FF453A', 'burgundy': '#8A0303' };

// Вспомогательная функция для форматов дат
const formatMonth = (m) => {
  const months = {'01':'Янв', '02':'Фев', '03': 'Мар', '04': 'Апр', '05': 'Мая', '06': 'Июн', '07': 'Июл', '08': 'Авг', '09': 'Сен', '10': 'Окт', '11':'Ноя', '12':'Дек'};
  return months[m] || m;
};

/**
 * Хук для определения типа устройства (мобильный/десктоп) и обновления при изменении размера окна.
 * @returns {boolean} true, если ширина экрана меньше 768px, иначе false.
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);
  return isMobile;
};

// Компонент кастомной легенды (одинаков для обоих графиков)
// ВЫНЕСЕН ИЗ APP ДЛЯ ПРЕДОТВРАЩЕНИЯ ЛИШНИХ РЕРЕНДЕРОВ
const CustomLegend = ({ datasets, hiddenState, toggleFn, isArchive }) => {
  let groups = {};
  if (isArchive) {
    datasets.forEach(ds => {
      const baseName = ds.label.split(' ')[0];
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(ds);
    });
  } else {
    groups['Деревья'] = datasets;
  }

  const groupOrder = ['Береза', 'Ольха', 'Орешник', 'Дуб', 'Деревья'];
  
  // Функция сопоставления иконок аллергенам
  const getIconForAllergen = (label) => {
    if (label.includes('Ольха') || label.includes('Дуб')) return TreeDeciduous;
    if (label.includes('Орешник')) return Leaf;
    if (label.includes('Береза')) return TreePine;
    return TreeDeciduous;
  };

  return (
    <div className="custom-legend-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
      {Object.entries(groups)
        .sort(([a], [b]) => {
          let iA = groupOrder.indexOf(a); if (iA === -1) iA = 99;
          let iB = groupOrder.indexOf(b); if (iB === -1) iB = 99;
          return iA - iB;
        })
        .map(([groupName, items]) => (
        <div className="legend-group" key={groupName} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '8px', background: 'transparent', padding: 0, border: 'none', margin: 0 }}>
          {groupName !== 'Деревья' && (
            <div className="legend-group-title" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', borderBottom: 'none', padding: 0, fontWeight: 500 }}>
              {groupName}:
            </div>
          )}
          {items
            .sort((a, b) => {
              const yearA = parseInt(a.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
              const yearB = parseInt(b.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
              return yearB - yearA;
            })
            .map(ds => {
              const IconComp = getIconForAllergen(ds.label);
              const itemColor = ds.borderColor || ds.backgroundColor || '#fff';
              return (
                <div 
                  key={ds.label} 
                  className={`legend-item${hiddenState[ds.label] ? ' hidden-dataset' : ''}`}
                  onClick={() => toggleFn(ds.label)}
                >
                  <IconComp size={16} color={itemColor} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span className="legend-label">
                    {isArchive ? (ds.label.match(/\((\d{4})\)/)?.[1] || ds.label) : ds.label}
                  </span>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
};

// Вспомогательный компонент для фиксации осей при скролле с автоматической "прозрачной" маской
const ChartWithStickyAxis = ({ chartData, chartOptions, type: ChartComponent, leftWidth = '45px' }) => {
  const maskData = {
    ...chartData,
    datasets: chartData.datasets.map(ds => ({
      ...ds,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointRadius: 0,
      pointHoverRadius: 0
    }))
  };

  // Отключаем тултипы и делаем невидимыми подписи оси X, чтобы оставались только Y-цифры и сетка
  const maskOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...(chartOptions.scales?.x || {}),
        ticks: {
          ...(chartOptions.scales?.x?.ticks || {}),
          color: 'transparent'
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: { enabled: false }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="chart-scroll-wrapper custom-scrollbar">
        <div className="chart-container">
          <ChartComponent data={chartData} options={chartOptions} />
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 10, pointerEvents: 'none', clipPath: `inset(0 calc(100% - ${leftWidth}) 0 0)`
      }}>
        <div className="chart-scroll-wrapper custom-scrollbar" style={{ overflow: 'hidden' }}>
          <div className="chart-container">
            <ChartComponent data={maskData} options={maskOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  // Состояния для экрана блокировки
  const [locked, setLocked] = useState(true);
  const [role, setRole] = useState(null); // 'admin', 'editor', 'viewer'
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Получаем данные и функции из хука
  const { historyData: dbHistoryData, latestData: dbLatestData, fetchMeasurements } = useMeasurements();

  // Определяем тип устройства
  const isMobile = useIsMobile();

  // Проверка сохраненной сессии (на 7 дней) при загрузке приложения
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuth');
    const authTimestamp = localStorage.getItem('authTimestamp');
    const savedRole = localStorage.getItem('authRole');

    if (isAuth === 'true' && authTimestamp) {
      const now = Date.now();
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      if (now - parseInt(authTimestamp, 10) < SEVEN_DAYS_MS) {
        setLocked(false);
        if (savedRole) setRole(savedRole);
      } else {
        localStorage.removeItem('isAuth');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('authRole');
      }
    }
  }, []);

  // Fallback: Если в БД пока нет записей пыльцы, подставляем демо-данные (ARCHIVE_2026_DATA)
  const historyData = dbHistoryData.length > 0 
    ? dbHistoryData 
    : Object.entries(ARCHIVE_2026_DATA).map(([date, data]) => ({ date, ...data })).reverse();
  const latestData = dbLatestData || historyData[0];

  // Отсекаем будущие даты и пустые фиктивные записи (из миграции погоды), чтобы виджеты обрывались на последнем реальном замере
  const now = new Date();
  const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  let validHistory = historyData.filter(d => d.date <= localTodayStr);

  // Находим последний реальный замер (где сумма пыльцы > 0), чтобы отсечь пустые погодные дни
  const firstRealIndex = validHistory.findIndex(d => {
    const total = (d.alder || 0) + (d.hazel || 0) + (d.birch || 0) + (d.oak || 0) + 
                  (d.grass || 0) + (d.weed || 0) + (d.clado || 0) + (d.alt || 0);
    return total > 0;
  });

  if (firstRealIndex > 0) {
    validHistory = validHistory.slice(firstRealIndex);
  }

  const activeLatestData = validHistory[0] || latestData;

  // UI Состояния
  const [activeTab, setActiveTab] = useState(0);
  const viewsRef = useRef(null);
  const [todayScaleType, setTodayScaleType] = useState('linear');
  const [todayTimeRange, setTodayTimeRange] = useState(7);
  const [archiveRange, setArchiveRange] = useState('season'); // season, month, week
  const [archivePollenChartType, setArchivePollenChartType] = useState('bar'); // 'bar' or 'line'
  const [archivePollenScaleType, setArchivePollenScaleType] = useState('logarithmic'); // 'linear' or 'logarithmic'
  const [hiddenDatasetsToday, setHiddenDatasetsToday] = useState({});
  const [activeYears, setActiveYears] = useState(['2026', '2025', '2024', '2023']);
  const [activeAllergens, setActiveAllergens] = useState(['alder', 'hazel', 'birch', 'oak']);
  
  const { forecastData, currentWeather, isLoading: isWeatherLoading } = useWeather();

  // Загружаем данные, когда пользователь успешно ввел пароль
  useEffect(() => {
    if (!locked) {
      fetchMeasurements();
    }
  }, [locked, fetchMeasurements]);

  // Эффект для анимации карточек при скролле
  useEffect(() => {
    if (locked) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Небольшая задержка, чтобы DOM успел обновиться после смены вкладок
    const timeoutId = setTimeout(() => {
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => observer.observe(card));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [locked, activeTab, historyData, latestData]);

  // --- Навигация ---
  const switchTab = (index) => {
    setActiveTab(index);
    if (viewsRef.current) {
      viewsRef.current.scrollTo({ left: index * viewsRef.current.clientWidth, behavior: isMobile ? 'smooth' : 'auto' });
    }
  };
  const handleScroll = () => {
    if (!viewsRef.current) return;
    const scrollLeft = viewsRef.current.scrollLeft;
    const width = viewsRef.current.clientWidth;
    const newTab = Math.max(0, Math.min(1, Math.round(scrollLeft / width)));
    if (newTab !== activeTab) setActiveTab(newTab);
  };

  // --- Логика Риска для Сегодня ---
  const getRiskLevel = (data) => {
    if (!data) return { level: 'safe', label: 'НЕТ ДАННЫХ', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.1)' };

    const isAllNull = ['alder', 'hazel', 'birch', 'oak'].every(k => data[k] === null || data[k] === undefined);
    if (isAllNull) return { level: 'safe', label: 'НЕТ ДАННЫХ', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.1)' };

    const total = (data.alder || 0) + (data.hazel || 0) + (data.birch || 0) + (data.oak || 0);
    if (data.birch > 800 || total > 1000) return { level: 'critical', label: 'КРИТИЧЕСКИЙ', color: 'var(--critical)', bg: 'rgba(255, 69, 58, 0.15)' };
    if (data.alder > 300 || data.hazel > 150 || total > 400) return { level: 'high', label: 'ВЫСОКИЙ', color: 'var(--high)', bg: 'rgba(255, 159, 10, 0.15)' };
    if (total > 50) return { level: 'warning', label: 'СРЕДНИЙ', color: 'var(--warning)', bg: 'rgba(255, 214, 10, 0.15)' };
    if (total > 10) return { level: 'safe', label: 'НИЗКИЙ', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
    return { level: 'safe', label: 'БЕЗОПАСНО', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
  };
  const currentRisk = getRiskLevel(activeLatestData);

  const handleDownloadBackup = () => {
    if (!dbHistoryData || dbHistoryData.length === 0) {
      alert("В базе данных нет записей для скачивания.");
      return;
    }

    const pollenRecords = [];
    const weatherRecords = [];
    let latestPollenDate = '';
    let latestWeatherDate = '';

    dbHistoryData.forEach(item => {
      const { date, tempAvg, precip, windMax, humidity, tempMax, tempMin, phenomena, ...pollenProps } = item;
      
      // Отбираем записи, где есть хотя бы один замер пыльцы
      const hasPollen = ['alder', 'hazel', 'birch', 'oak', 'grass', 'weed', 'clado', 'alt'].some(k => pollenProps[k] !== undefined && pollenProps[k] !== null);
      if (hasPollen) {
        pollenRecords.push({ date, ...pollenProps });
        if (date > latestPollenDate) latestPollenDate = date;
      }

      // Отбираем записи, где есть хотя бы один замер погоды
      const hasWeather = tempAvg !== undefined || precip !== undefined || humidity !== undefined || tempMax !== undefined;
      if (hasWeather) {
        weatherRecords.push({ date, tempAvg, tempMax, tempMin, precip, windMax, humidity, phenomena });
        if (date > latestWeatherDate) latestWeatherDate = date;
      }
    });

    const downloadJson = (filename, data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (pollenRecords.length > 0) downloadJson(`Пыльца_${latestPollenDate}.json`, pollenRecords);
    if (weatherRecords.length > 0) downloadJson(`погода_${latestWeatherDate}.json`, weatherRecords);
  };

  const handleMigration = async () => {
    if (!window.confirm("Вы уверены, что хотите загрузить локальные архивы (2023-2026) в Firebase? Существующие записи за эти даты будут перезаписаны.")) return;
    setIsMigrating(true);
    
    try {
      const records = {};

      const addPollen = (date, tree, value) => {
        if (!records[date]) records[date] = { date };
        records[date][tree] = value;
      };

      const addWeather = (date, w) => {
        if (!records[date]) records[date] = { date };
        if (w.tempMin !== undefined && w.tempMax !== undefined) records[date].tempAvg = Math.round((w.tempMin + w.tempMax) / 2);
        if (w.precip !== undefined) records[date].precip = w.precip;
        if (w.windSpeedMax !== undefined) records[date].windMax = w.windSpeedMax;
        if (w.humidity !== undefined) records[date].humidity = w.humidity;
      };

      // Парсим ARCHIVE_2026_DATA
      Object.entries(ARCHIVE_2026_DATA).forEach(([date, data]) => {
         Object.entries(data).forEach(([tree, val]) => { if (val !== null) addPollen(date, tree, val); });
      });

      // Парсим смешанный ARCHIVE_2025
      Object.entries(ARCHIVE_2025).forEach(([mmdd, data]) => {
         const cleanMmdd = mmdd.substring(0, 5); 
         Object.entries(data).forEach(([key, val]) => {
            if (val === null) return;
            if (key.includes('_')) {
               const [tree, year] = key.split('_');
               addPollen(`${year}-${cleanMmdd}`, tree, val);
            } else {
               addPollen(`2025-${cleanMmdd}`, key, val);
            }
         });
      });

      // Парсим погоду
      const weathers = [{ year: '2026', data: WEATHER_ARCHIVE_2026 }, { year: '2025', data: WEATHER_ARCHIVE_2025 }, { year: '2024', data: WEATHER_ARCHIVE_2024 }, { year: '2023', data: WEATHER_ARCHIVE_2023 }];
      weathers.forEach(({ year, data }) => {
         Object.entries(data).forEach(([mmdd, w]) => addWeather(`${year}-${mmdd.substring(0,5)}`, w));
      });

      let count = 0;
      for (const [date, data] of Object.entries(records)) {
         const cleanData = { date, alder: 0, hazel: 0, birch: 0, oak: 0, grass: 0, weed: 0, clado: 0, alt: 0, ...data };
         await setDoc(doc(db, 'measurements', date), cleanData);
         count++;
      }
      alert(`Успешно выгружено ${count} записей в Firebase!`);
      fetchMeasurements(); // Обновляем локальное состояние из БД
    } catch (err) {
      console.error(err);
      alert('Ошибка миграции: ' + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // --- ДАННЫЕ ГРАФИКА: СЕГОДНЯ ---
      let recentHistory = [...validHistory];
      if (todayTimeRange !== 'all') {
        // Показываем последние N замеров, чтобы избежать пустых графиков из-за пропущенных дней
        recentHistory = recentHistory.slice(0, todayTimeRange);
      }
      recentHistory = recentHistory.reverse();

  const todayChartData = {
    labels: recentHistory.map(d => {
      const [year, month, day] = d.date.split('-');
      return `${day}.${month}.${year.slice(-2)}`;
    }),
    datasets: [
      { label: 'Ольха', data: recentHistory.map(d => d.alder ?? null), borderColor: '#32D74B', backgroundColor: 'rgba(50,215,75,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Орешник', data: recentHistory.map(d => d.hazel ?? null), borderColor: '#FFD60A', backgroundColor: 'rgba(255,214,10,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Береза', data: recentHistory.map(d => d.birch ?? null), borderColor: '#FF453A', backgroundColor: 'rgba(255,69,58,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Дуб', data: recentHistory.map(d => d.oak ?? null), borderColor: '#8A0303', backgroundColor: 'rgba(138,3,3,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 }
    ]
  };

  const activeTodayChartData = {
    ...todayChartData,
    datasets: todayChartData.datasets.map(ds => ({...ds, hidden: !!hiddenDatasetsToday[ds.label]}))
  };

  const chartOptionsCommon = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 30, 0.95)', titleColor: 'rgba(235, 235, 245, 0.6)', bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, padding: 12, boxPadding: 6, usePointStyle: true,
        filter: function(context) {
          if (context.dataset.label.includes('Температура')) return true;
          return context.parsed.y !== null;
        }
      }
    }
  };

  // --- ДАННЫЕ ГРАФИКА: АРХИВ ---
  const filteredArchiveKeys = useMemo(() => {
    const archiveKeys = Object.keys(ARCHIVE_2025).filter(k => /^\d{2}-\d{2}$/.test(k));
    const historyKeys = historyData.map(d => d.date.substring(5)); // Извлекаем MM-DD из БД
    const rawKeys = [...new Set([...archiveKeys, ...historyKeys])].sort();
    
    if (rawKeys.length === 0) return [];
    
    const startStr = rawKeys[0];
    const endStr = rawKeys[rawKeys.length - 1];
    
    // Создаем непрерывный массив дат (чтобы не пропускать дни без данных, например 12 апреля)
    const allKeys = [];
    const current = new Date(`2024-${startStr}T00:00:00Z`); // Используем високосный 2024 для учета 29 февраля
    const end = new Date(`2024-${endStr}T00:00:00Z`);
    
    while (current <= end) {
      const m = String(current.getUTCMonth() + 1).padStart(2, '0');
      const d = String(current.getUTCDate()).padStart(2, '0');
      allKeys.push(`${m}-${d}`);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const now = new Date();

    if (archiveRange === 'season') {
      // Оптимизация поиска: создаем Map из истории для O(1) доступа
      const historyMap = new Map();
      historyData.forEach(d => historyMap.set(d.date, d));

      let firstActiveIndex = -1;
      let lastActiveIndex = -1;

      // Ищем крайние даты с реальными данными (> 0)
      for (let i = 0; i < allKeys.length; i++) {
        const k = allKeys[i];
        let hasData = false;
        for (const allergen of activeAllergens) {
          for (const year of activeYears) {
            const record = historyMap.get(`${year}-${k}`);
            if (record && record[allergen] > 0) { hasData = true; break; }
            const dataKey = year === '2025' ? allergen : `${allergen}_${year}`;
            if (ARCHIVE_2025[k]?.[dataKey] > 0) { hasData = true; break; }
          }
          if (hasData) break;
        }
        if (hasData) {
          if (firstActiveIndex === -1) firstActiveIndex = i;
          lastActiveIndex = i;
        }
      }

      if (firstActiveIndex !== -1 && lastActiveIndex !== -1) {
        const startIdx = Math.max(0, firstActiveIndex - 3); // Оставляем 3 дня слева
        const endIdx = Math.min(allKeys.length, lastActiveIndex + 4); // Оставляем 3 дня справа
        return allKeys.slice(startIdx, endIdx);
      }
      return allKeys;
    }
    if (archiveRange === 'month') {
      const targetMonth = String(now.getMonth() + 1).padStart(2, '0');
      const monthKeys = allKeys.filter(k => k.startsWith(targetMonth));
      return monthKeys.length > 0 ? monthKeys : allKeys.filter(k => k.startsWith('04')); // фолбэк на апрель для демо-данных
    }
    if (archiveRange === 'week') {
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
      const weekKeys = allKeys.filter(k => last7Days.includes(k.substring(0, 5)));
      return weekKeys.length > 0 ? weekKeys : allKeys.slice(-7); // фолбэк на последние 7 дней из демо-данных
    }
    return allKeys;
  }, [archiveRange, historyData, activeAllergens, activeYears]);

  const archiveLabels = filteredArchiveKeys.map(k => `${parseInt(k.split('-')[1], 10)} ${formatMonth(k.split('-')[0])}`);

  const buildDynamicArchiveDatasets = () => {
    const datasets = [];
    const allergenNames = { 'alder': 'Ольха', 'hazel': 'Орешник', 'birch': 'Береза', 'oak': 'Дуб' };
    
    activeAllergens.forEach(allergen => {
      activeYears.forEach(year => {
        const dataKey = year === '2025' ? allergen : `${allergen}_${year}`;
        const isSingleAllergen = activeAllergens.length === 1;
        
        let borderColor, backgroundColor, borderDash;
        
        // ШАГ 2: Чистые фоновые цвета вместо грязной полупрозрачности
        const getSolidDarkColor = (baseHex, yearStr) => {
          if (yearStr === '2026') return baseHex;
          const palettes = {
            '#32D74B': { '2025': '#166534', '2024': '#14532d', '2023': '#064e3b' }, // Зеленый
            '#FFD60A': { '2025': '#a16207', '2024': '#854d0e', '2023': '#713f12' }, // Желтый
            '#FF453A': { '2025': '#b91c1c', '2024': '#991b1b', '2023': '#7f1d1d' }, // Красный
            '#0A84FF': { '2025': '#1d4ed8', '2024': '#1e3a8a', '2023': '#172554' }, // Синий
            '#64D2FF': { '2025': '#0369a1', '2024': '#075985', '2023': '#082f49' }, // Голубой (2026 single)
            '#FF8A65': { '2025': '#c2410c', '2024': '#9a3412', '2023': '#7c2d12' }  // Оранжевый (2024 single)
          };
          return palettes[baseHex]?.[yearStr] || baseHex;
        };
        
        if (isSingleAllergen) {
          const yearColors = { '2026': '#64D2FF', '2025': '#FFD60A', '2024': '#FF8A65', '2023': '#32D74B' };
          borderColor = getSolidDarkColor(yearColors[year] || '#ffffff', year);
          backgroundColor = archivePollenChartType === 'bar' ? borderColor : 'transparent';
          borderDash = ['2026', '2025'].includes(year) ? [] : [4, 4];
        } else {
          const allergenColors = { 'alder': '#32D74B', 'hazel': '#FFD60A', 'birch': '#FF453A', 'oak': '#0A84FF' };
          const yearDashes = { '2026': [], '2025': [], '2024': [4, 4], '2023': [2, 4] };
          
          borderColor = getSolidDarkColor(allergenColors[allergen] || '#ffffff', year);
          backgroundColor = archivePollenChartType === 'bar' ? borderColor : 'transparent';
          borderDash = yearDashes[year] || [];
        }

        const isCurrentYear = year === '2026';
        const lineThickness = isCurrentYear ? (isMobile ? 2.5 : 3.5) : (isMobile ? 1.5 : 2.5);
        const zIndexOrder = { '2026': 1, '2025': 2, '2024': 3, '2023': 4 };

        datasets.push({
          label: `${allergenNames[allergen]} (${year})`,
          data: filteredArchiveKeys.map(k => {
            let val = null;
            
            // Сначала ищем реальные данные в БД (historyData)
            const record = historyData.find(d => d.date === `${year}-${k}`);
            if (record && record[allergen] !== undefined && record[allergen] !== null) {
              val = record[allergen];
            } else {
              // Если в БД нет, берем из захардкоженного архива
              const dataKey = year === '2025' ? allergen : `${allergen}_${year}`;
              val = ARCHIVE_2025[k]?.[dataKey] ?? null;
            }
            
            if (archivePollenScaleType === 'logarithmic' && val === 0) val = null;
            return val;
          }),
          type: archivePollenChartType,
          order: zIndexOrder[year], // Сортировка Z-index (меньше значение = поверх всех)
          borderColor,
          backgroundColor,
          borderDash,
          fill: false,
          tension: 0.4,
          pointRadius: isMobile ? (isCurrentYear ? 2 : 0) : (isCurrentYear ? 4 : 2),
          pointHoverRadius: isMobile ? 4 : 6,
          borderWidth: archivePollenChartType === 'bar' ? 0 : lineThickness,
          ...(archivePollenChartType === 'bar' && {
            barPercentage: 0.85,      // ШАГ 1: Зазор между столбцами внутри одного дня
            categoryPercentage: 0.75, // ШАГ 1: Воздух между соседними днями
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 }, // ШАГ 3: Apple-style скругление
          }),
        });
      });
    });
    return datasets;
  };

  const archiveChartData = {
    labels: archiveLabels,
    datasets: buildDynamicArchiveDatasets()
  };

  const xAxisTicksConfig = {
    maxRotation: 0,
    autoSkip: true,
    maxTicksLimit: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    font: { size: 10 }
  };

  return (
    <div className="app-container">
      {/* ЭКРАН БЛОКИРОВКИ */}
      <LoginScreen 
        isLocked={locked} 
        onUnlock={(assignedRole) => { 
          setRole(assignedRole); 
          setLocked(false); 
          localStorage.setItem('isAuth', 'true');
          localStorage.setItem('authTimestamp', Date.now().toString());
          if (assignedRole) localStorage.setItem('authRole', assignedRole);
        }} 
      />

      {/* УНИВЕРСАЛЬНОЕ МОДАЛЬНОЕ ОКНО */}
      {!locked && (
        <AddDataModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditData(null); }}
          editData={editData}
          onSuccess={fetchMeasurements}
          historyData={historyData}
        />
      )}

      {!locked && (
        <>
          {/* ШАПКА В ОБЩЕМ ПОТОКЕ */}
          <header className="header relative" style={{ position: 'relative' }}>
            <div className="header-top" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingBottom: '4px' }}>
              <div style={{ background: 'rgba(28, 28, 30, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px 14px', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                Москва
              </div>
              <div style={{ background: 'rgba(28, 28, 30, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {new Date().toLocaleDateString('ru-RU', {day:'numeric', month:'long'})}
              </div>
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <WeatherWidget weather={currentWeather} forecastData={forecastData} loading={isWeatherLoading} />
              </div>
            </div>
            
            <div className="segment-control">
              <div className="segment-indicator" style={{ width: 'calc(50% - 2px)', transform: `translateX(${activeTab * 100}%)` }}></div>
              <button className={`segment-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => switchTab(0)}>СЕГОДНЯ</button>
              <button className={`segment-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => switchTab(1)}>АРХИВ</button>
            </div>
          </header>

          <div className="views-wrapper" ref={viewsRef} onScroll={handleScroll}>
            
            {/* VIEW 1: TODAY */}
            <div className="view-pane" style={!isMobile && activeTab !== 0 ? { height: 0, minHeight: 0, padding: 0, margin: 0, overflow: 'hidden', border: 0, visibility: 'hidden' } : {}}>
              <SeasonProgressWidget 
                data={{
                  alderHazelAuc: historyData.filter(d => d.date && d.date.startsWith('2026')).reduce((sum, d) => sum + (d.alder || 0) + (d.hazel || 0), 0),
                  birchAuc: historyData.filter(d => d.date && d.date.startsWith('2026')).reduce((sum, d) => sum + (d.birch || 0), 0)
                }} 
                historyData={historyData}
              />

              {!activeLatestData ? (
                <div className="empty-state">Данных с ловушек за сегодня пока нет 🤷‍♂️</div>
              ) : (
                <div className="card overflow-hidden w-full">
                  <div className="risk-header" style={{ marginBottom: 15, alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="section-title" style={{ marginBottom: 2 }}><Microscope size={18} /> Данные ловушек</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 26 }}>Дата измерений: {activeLatestData.date.split('-').reverse().join('.')}</div>
                    </div>
                    <div className={`risk-badge ${currentRisk.level === 'high' || currentRisk.level === 'critical' ? 'breathe-effect' : ''}`} style={{ background: currentRisk.bg, color: currentRisk.color, '--breathe-color': currentRisk.color }}>
                      {currentRisk.label}
                    </div>
                  </div>
                  <div className="pollen-list">
                    {[{id: 'alder', name: 'Ольха', icon: TreeDeciduous}, {id: 'hazel', name: 'Орешник', icon: Leaf}, {id: 'birch', name: 'Береза', icon: TreePine}, {id: 'oak', name: 'Дуб', icon: TreeDeciduous}].map(item => {
                       const val = activeLatestData[item.id];
                       const isNull = val === null || val === undefined;
                       const itemRisk = isNull ? {color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)'} : getRiskLevel({[item.id]: val});
                       return (
                         <div className="pollen-item" key={item.id} style={{ opacity: isNull ? 0.7 : 1 }}>
                           <div className="pollen-left">
                             <div className="pollen-icon-wrapper" style={{ background: itemRisk.bg, color: '#ffffff' }}>
                               <item.icon size={20} className="pollen-anim-icon" />
                             </div>
                             <div className="pollen-name">{item.name}</div>
                           </div>
                           <div className="pollen-right">
                             <div className="pollen-value" style={{ color: isNull ? 'var(--text-main)' : itemRisk.color }}>{isNull ? '—' : <>{val} <span style={{fontSize: 12, color: 'var(--text-secondary)', fontWeight: 'normal'}}>ед/м³</span></>}</div>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              )}

              <div className="card overflow-hidden w-full" style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: '10px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}><TrendingUp size={18} /> Динамика пыления</h3>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="segment-control" style={{ width: 90, padding: 2, flexShrink: 0, height: 26 }}>
                      <div className="segment-indicator" style={{ transform: `translateX(${todayScaleType === 'linear' ? 0 : 100}%)`, width: 'calc(50% - 2px)', background: '#48484A' }}></div>
                      <button className={`segment-btn ${todayScaleType==='linear'?'active':''}`} onClick={() => setTodayScaleType('linear')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LIN</button>
                      <button className={`segment-btn ${todayScaleType==='logarithmic'?'active':''}`} onClick={() => setTodayScaleType('logarithmic')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LOG</button>
                    </div>
                    <select value={todayTimeRange} onChange={(e) => setTodayTimeRange(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', padding: '0 10px', fontSize: '12px', outline: 'none', cursor: 'pointer', height: 26 }}>
                      <option value={7} style={{ color: '#000' }}>Неделя</option>
                      <option value={30} style={{ color: '#000' }}>Месяц</option>
                      <option value="all" style={{ color: '#000' }}>Все время</option>
                    </select>
                    {role !== 'viewer' && (
                      <button className="add-data-btn" onClick={() => { setEditData(null); setIsModalOpen(true); }}><Plus size={18} /></button>
                    )}
                  </div>
                </div>

                <CustomLegend datasets={todayChartData.datasets} hiddenState={hiddenDatasetsToday} toggleFn={(lbl) => setHiddenDatasetsToday(p => ({...p, [lbl]: !p[lbl]}))} isArchive={false} />

                <div className="chart-container" style={{ position: 'relative', width: '100%', maxWidth: '100%', height: '300px', minWidth: 0 }}>
                  <Line 
                    data={activeTodayChartData}
                    options={{
                      ...chartOptionsCommon, 
                      plugins: {
                        ...chartOptionsCommon.plugins,
                        tooltip: {
                          ...chartOptionsCommon.plugins.tooltip,
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
                        x: { grid: { display: false }, ticks: {color: '#EBEBF599'}}, 
                        y: { 
                          type: todayScaleType, 
                          min: todayScaleType === 'logarithmic' ? 0.5 : 0, 
                          grid: { color: 'rgba(255,255,255,0.05)' }, 
                          ticks: {color: '#EBEBF599', callback: (v) => (todayScaleType === 'logarithmic' ? ([1,10,100,1000,10000].includes(v) ? v : null) : v)} 
                        }
                      }
                    }}
                  />
                  {activeTodayChartData.labels.length === 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,28,30,0.6)', backdropFilter: 'blur(2px)', borderRadius: 12, color: 'var(--text-main)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                      База данных пуста.<br/>Нажмите «+» в правом верхнем углу, чтобы внести первые замеры.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VIEW 2: ARCHIVE */}
            <div className="view-pane" style={!isMobile && activeTab !== 1 ? { height: 0, minHeight: 0, padding: 0, margin: 0, overflow: 'hidden', border: 0, visibility: 'hidden' } : {}}>
              <div className="card overflow-hidden w-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                  {/* Левая часть: Заголовок */}
                  <div style={{ minWidth: '200px' }}>
                    <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart2 size={18} /> Сравнение сезонов
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 26px' }}>Эстафета аллергенов: Деревья</p>
                  </div>

                  {/* Правая часть: Контролы */}
                  <div className="archive-controls">
                    
                    {/* 1. Фильтр периода */}
                    <div className="segment-control" style={{ width: 160, padding: 2, height: 28, flexShrink: 0 }}>
                      <div className="segment-indicator" style={{ width: 'calc(33.33% - 2px)', transform: `translateX(${archiveRange === 'season' ? 0 : (archiveRange === 'month' ? 100 : 200)}%)` }}></div>
                      <button className={`segment-btn ${archiveRange === 'season' ? 'active' : ''}`} onClick={() => setArchiveRange('season')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Сезон</button>
                      <button className={`segment-btn ${archiveRange === 'month' ? 'active' : ''}`} onClick={() => setArchiveRange('month')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Месяц</button>
                      <button className={`segment-btn ${archiveRange === 'week' ? 'active' : ''}`} onClick={() => setArchiveRange('week')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Неделя</button>
                    </div>

                    {/* Разделитель */}
                    <span className="archive-divider">|</span>

                    {/* 2. Иконки типа графика */}
                    <div className="chart-type-toggle" style={{ margin: 0, height: 28 }}>
                      <button 
                        className={`icon-btn ${archivePollenChartType === 'bar' ? 'active' : ''}`} 
                        onClick={() => setArchivePollenChartType('bar')}
                        title="Столбчатая диаграмма"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="20" x2="18" y2="10"></line>
                          <line x1="12" y1="20" x2="12" y2="4"></line>
                          <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                      </button>
                      <button 
                        className={`icon-btn ${archivePollenChartType === 'line' ? 'active' : ''}`} 
                        onClick={() => setArchivePollenChartType('line')}
                        title="Линейный график"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3v18h18"></path>
                          <path d="M7 16l5-5 4 4 5-5"></path>
                        </svg>
                      </button>
                    </div>

                    {/* 3. Шкала LIN/LOG */}
                    <div className="segment-control" style={{ width: 90, padding: 2, height: 28, flexShrink: 0 }}>
                      <div className="segment-indicator" style={{ width: 'calc(50% - 2px)', transform: `translateX(${archivePollenScaleType === 'linear' ? 0 : 100}%)` }}></div>
                      <button className={`segment-btn ${archivePollenScaleType === 'linear' ? 'active' : ''}`} onClick={() => setArchivePollenScaleType('linear')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>LIN</button>
                      <button className={`segment-btn ${archivePollenScaleType === 'logarithmic' ? 'active' : ''}`} onClick={() => setArchivePollenScaleType('logarithmic')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>LOG</button>
                    </div>

                  </div>
                </div>
                
                {/* ЗАМЕНА СТАРОЙ ЛЕГЕНДЫ НА DECOUPLED FILTERS */}
                <div className="w-full p-4 sm:p-5 rounded-[2rem] bg-[#161618]/60 backdrop-blur-xl border border-white/5 shadow-liquid mb-8 filter-panel">
                  
                  {/* Ряд: Аллергены */}
                  <div className="filter-row flex flex-wrap items-center gap-3 mb-4">
                    <span className="filter-label text-gray-500 text-xs font-bold uppercase tracking-widest w-24">Аллергены:</span>
                    <div className="filter-btn-group flex flex-wrap gap-1.5 sm:gap-2">
                      {['alder', 'hazel', 'birch', 'oak'].map(alg => {
                        const names = { alder: 'Ольха', hazel: 'Орешник', birch: 'Береза', oak: 'Дуб' };
                        const colors = { alder: '#32D74B', hazel: '#FFD60A', birch: '#FF453A', oak: '#0A84FF' };
                        const isActive = activeAllergens.includes(alg);
                        const isSingleAllergen = activeAllergens.length === 1;
                        
                        return (
                          <button
                            key={alg}
                            onClick={() => setActiveAllergens(prev => prev.includes(alg) && prev.length > 1 ? prev.filter(a => a !== alg) : prev.includes(alg) ? prev : [...prev, alg])}
                            className={`filter-btn px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border ${isActive ? 'active bg-white/15 text-white border-white/20 shadow-inner scale-95' : 'bg-transparent text-gray-400 border-white/5 hover:text-white hover:bg-white/5'}`}
                          >
                            <span 
                              className="filter-indicator w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors duration-300" 
                              style={{ 
                                backgroundColor: isActive ? (isSingleAllergen ? '#8E8E93' : colors[alg]) : 'rgba(255,255,255,0.1)', 
                                boxShadow: (isActive && !isSingleAllergen) ? `0 0 8px ${colors[alg]}` : 'none' 
                              }}
                            ></span>
                            {names[alg]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Ряд: Годы */}
                  <div className="filter-row flex flex-wrap items-center gap-3">
                    <span className="filter-label text-gray-500 text-xs font-bold uppercase tracking-widest w-24">Годы:</span>
                    <div className="filter-btn-group flex flex-wrap gap-1.5 sm:gap-2">
                      {['2026', '2025', '2024', '2023'].map(y => {
                        const isActive = activeYears.includes(y);
                        const isSingleAllergen = activeAllergens.length === 1;
                        const yearColors = { '2026': '#64D2FF', '2025': '#FFD60A', '2024': '#FF8A65', '2023': '#32D74B' };
                        
                        return (
                          <button 
                            key={y}
                            onClick={() => setActiveYears(prev => prev.includes(y) && prev.length > 1 ? prev.filter(year => year !== y) : prev.includes(y) ? prev : [...prev, y])}
                            className={`filter-btn px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border flex items-center ${isActive ? 'active bg-white/20 text-white border-white/20 shadow-inner scale-95' : 'bg-transparent text-gray-400 border-white/5 hover:text-white hover:bg-white/5'}`}
                          >
                            <span 
                              className={`filter-indicator rounded-full transition-all duration-300 ${isSingleAllergen ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 mr-1.5' : 'w-0 h-0 mr-0'}`} 
                              style={{ 
                                backgroundColor: isActive && isSingleAllergen ? yearColors[y] : 'transparent', 
                                boxShadow: isActive && isSingleAllergen ? `0 0 8px ${yearColors[y]}` : 'none' 
                              }}
                            ></span>
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <ChartWithStickyAxis 
                  leftWidth="45px"
                  type={archivePollenChartType === 'bar' ? Bar : Line}
                  chartData={archiveChartData}
                chartOptions={{
                  ...chartOptionsCommon, 
                  plugins: {
                    ...chartOptionsCommon.plugins,
                    tooltip: {
                      ...chartOptionsCommon.plugins.tooltip,
                      backgroundColor: 'rgba(22, 22, 24, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      itemSort: (a, b) => {
                        const yearA = parseInt(a.dataset.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
                        const yearB = parseInt(b.dataset.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
                        return yearB - yearA; // Сортировка сверху вниз от 2026 к 2023
                      },
                      filter: (context) => context.parsed.y > 0, // Исключение нулей
                    }
                  },
                  scales: { 
                    x: { grid: { display: false }, ticks: xAxisTicksConfig }, 
                    y: { 
                      type: archivePollenScaleType, 
                      min: archivePollenScaleType === 'logarithmic' ? 0.5 : 0, 
                      grid: { color: 'rgba(255,255,255,0.05)', borderDash: [3, 3], drawBorder: false }, 
                      ticks: {color: '#EBEBF599', callback: (v) => (archivePollenScaleType === 'logarithmic' ? ([1,10,100,1000,10000].includes(v) ? v : null) : v)} 
                    }
                  }
                }}
                />
              </div>

              {/* ТЕПЛОВАЯ КАРТА ПЫЛЕНИЯ (HEATMAP) */}
              <div className="card overflow-hidden w-full">
                <h3 className="section-title"><Calendar size={18} /> Тепловая карта пыления</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 15 }}>
                  Интенсивность выбросов по дням (светлее — низкая, ярче — экстремальная).
                </p>
                
                {isMobile ? (
                  <div className="heatmap-mobile custom-scrollbar" style={{ overflowY: 'auto', maxHeight: '60vh', paddingRight: 5 }}>
                    <div className="flex md:hidden mb-2 w-full pl-[52px] pr-2" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(28, 28, 30, 0.95)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', paddingLeft: '52px', paddingTop: '8px', paddingBottom: '8px', display: 'flex', width: '100%' }}>
                      <div className="grid grid-cols-4 w-full gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', width: '100%', gap: '4px' }}>
                        {/* Ольха */}
                        <div className="flex flex-col items-center overflow-hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="text-[#4ade80] text-[8px] sm:text-[9px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#4ade80', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '2px' }}>Ольха</span>
                          <div className="flex justify-between w-full px-0.5" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                            <span className="text-white font-bold text-[7px] sm:text-[8px]" style={{ color: '#fff', fontWeight: 'bold', fontSize: '8px' }}>26</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>25</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>24</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>23</span>
                          </div>
                        </div>
                        {/* Орешник */}
                        <div className="flex flex-col items-center overflow-hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="text-[#eab308] text-[8px] sm:text-[9px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#eab308', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '2px' }}>Орешник</span>
                          <div className="flex justify-between w-full px-0.5" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                            <span className="text-white font-bold text-[7px] sm:text-[8px]" style={{ color: '#fff', fontWeight: 'bold', fontSize: '8px' }}>26</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>25</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>24</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>23</span>
                          </div>
                        </div>
                        {/* Берёза */}
                        <div className="flex flex-col items-center overflow-hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="text-[#ef4444] text-[8px] sm:text-[9px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#ef4444', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '2px' }}>Берёза</span>
                          <div className="flex justify-between w-full px-0.5" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                            <span className="text-white font-bold text-[7px] sm:text-[8px]" style={{ color: '#fff', fontWeight: 'bold', fontSize: '8px' }}>26</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>25</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>24</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>23</span>
                          </div>
                        </div>
                        {/* Дуб */}
                        <div className="flex flex-col items-center overflow-hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="text-[#3b82f6] text-[8px] sm:text-[9px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#3b82f6', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '2px' }}>Дуб</span>
                          <div className="flex justify-between w-full px-0.5" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                            <span className="text-white font-bold text-[7px] sm:text-[8px]" style={{ color: '#fff', fontWeight: 'bold', fontSize: '8px' }}>26</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>25</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>24</span>
                            <span className="text-gray-500 text-[7px] sm:text-[8px]" style={{ color: '#6b7280', fontSize: '8px' }}>23</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {archiveLabels.map((lbl, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 47, fontSize: 10, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                            {lbl}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <AnimatePresence>
                            {archiveChartData.datasets.map((ds, dsIndex) => {
                              const val = ds.data[i];
                              const baseColor = ds.borderColor && ds.borderColor.startsWith('#') 
                                ? ds.borderColor.substring(0, 7) 
                                : 'var(--accent)';
                              let opacity = 0.02;
                              if (val > 0) {
                                if (val < 10) opacity = 0.3;
                                else if (val < 100) opacity = 0.6;
                                else if (val < 500) opacity = 0.85;
                                else opacity = 1;
                              }
                              return (
                                <motion.div 
                                  key={ds.label} 
                                  layout
                                  initial={{ opacity: 0, scale: 0.3, width: 0, marginRight: -4 }}
                                  animate={{ opacity: val > 0 ? opacity : 1, scale: 1, width: 14, marginRight: 0 }}
                                  exit={{ opacity: 0, scale: 0.3, width: 0, marginRight: -4 }}
                                  transition={{ duration: 0.3, delay: (i * 0.015) + (dsIndex * 0.015) }}
                                  title={`${ds.label} | ${lbl}: ${val !== null ? val : 0} ед/м³`}
                                  style={{
                                    height: 14, borderRadius: 3, flexShrink: 0,
                                    backgroundColor: val > 0 ? baseColor : 'rgba(255,255,255,0.02)',
                                    boxShadow: val > 10 ? `0 0 ${opacity * 12}px ${baseColor}` : 'none'
                                  }} 
                                />
                              );
                            })}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                <div className="heatmap-wrapper custom-scrollbar" style={{ overflowX: 'auto', paddingBottom: 15 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 'max-content' }}>
                    <AnimatePresence>
                    {archiveChartData.datasets.map((ds, index, arr) => {
                      // Очищаем цвет (удаляем альфа-канал, если он есть, например #32D74BFF -> #32D74B)
                      const baseColor = ds.borderColor && ds.borderColor.startsWith('#') 
                        ? ds.borderColor.substring(0, 7) 
                        : 'var(--accent)';
                      
                      // Определяем, началась ли новая группа деревьев (для добавления "воздуха" между ними)
                      const currentBaseName = ds.label.split(' ')[0];
                      const prevBaseName = index > 0 ? arr[index - 1].label.split(' ')[0] : currentBaseName;
                      const isNewGroup = currentBaseName !== prevBaseName;

                      return (
                        <motion.div 
                          key={ds.label} 
                          layout
                          initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: -6 }}
                          animate={{ opacity: 1, height: 14, marginTop: isNewGroup ? 16 : 0, marginBottom: 0, transitionEnd: { overflow: 'visible' } }}
                          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: -6, overflow: 'hidden' }}
                          style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                        >
                          <div style={{ width: 108, flexShrink: 0, paddingRight: 8, position: 'sticky', left: 0, zIndex: 2, background: 'rgba(28, 28, 30, 0.95)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ds.label}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {ds.data.map((val, i) => {
                              let opacity = 0.02; // Дефолтный тусклый фон для пустых дней
                              if (val > 0) {
                                if (val < 10) opacity = 0.3;     // Легкая активность
                                else if (val < 100) opacity = 0.6; // Средняя
                                else if (val < 500) opacity = 0.85;// Высокая
                                else opacity = 1;                  // Экстремальная
                              }
                              return (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, scale: 0.3 }}
                                  animate={{ opacity: val > 0 ? opacity : 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: (i * 0.015) + (index * 0.015) }}
                                  whileHover={{ scale: 1.2 }}
                                  title={`${ds.label} | ${archiveLabels[i]}: ${val !== null ? val : 0} ед/м³`}
                                  style={{
                                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                                    backgroundColor: val > 0 ? baseColor : 'rgba(255,255,255,0.02)',
                                    boxShadow: val > 10 ? `0 0 ${opacity * 12}px ${baseColor}` : 'none', // LED-свечение
                                    cursor: 'crosshair'
                                  }} 
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                    
                    {/* Подписи оси X */}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ width: 108, flexShrink: 0, position: 'sticky', left: 0, zIndex: 2, background: 'rgba(28, 28, 30, 0.95)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>&nbsp;</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {archiveLabels.map((lbl, i) => (
                          <div key={i} style={{ width: 14, flexShrink: 0, position: 'relative' }}>
                            {i % 4 === 0 && (
                              <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 9, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {lbl.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>

              <WeatherContextChart 
                filteredArchiveKeys={filteredArchiveKeys}
                archiveLabels={archiveLabels}
                isMobile={isMobile}
                chartOptionsCommon={chartOptionsCommon}
                weatherData2023={WEATHER_ARCHIVE_2023}
                weatherData2024={WEATHER_ARCHIVE_2024}
                weatherData2025={WEATHER_ARCHIVE_2025}
                weatherData2026={WEATHER_ARCHIVE_2026}
              />

              <div className="card" style={{ marginBottom: 30 }}>
                <h3 className="section-title"><Calendar size={18} /> Сводка 2023-2026</h3>
                <table className="summary-table">
                  <tbody>
                    <tr><th style={{width: '60px'}}>Год</th><th>Статус / Пик</th></tr>
                    {STATIC_SUMMARY.map(row => (
                      <tr key={row.year}>
                        <td style={{ fontWeight: 600 }}>{row.year}</td>
                        <td><span className="status-dot" style={{ backgroundColor: colorMap[row.level] }}></span>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* КНОПКА МИГРАЦИИ ДЛЯ АДМИНИСТРАТОРА */}
              {role === 'admin' && (
                <div className="card" style={{ marginBottom: 30 }}>
                  <h3 className="section-title"><DatabaseBackup size={18} /> Управление базой данных</h3>
                  
                  {/* Кнопка резервной копии */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, paddingBottom: 15, borderBottom: '1px solid var(--glass-border)', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{ background: 'rgba(50, 215, 75, 0.15)', color: 'var(--safe)', padding: 12, borderRadius: 14 }}>
                        <Download size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Резервная копия</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Скачать базу пыльцы и погоды на ПК</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleDownloadBackup}
                      style={{ background: 'rgba(50, 215, 75, 0.2)', color: 'var(--safe)', border: '1px solid var(--safe)', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
                    >
                      Скачать файлы
                    </button>
                  </div>

                  {/* Кнопка миграции */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{ background: 'rgba(10, 132, 255, 0.15)', color: 'var(--accent)', padding: 12, borderRadius: 14 }}>
                        <DatabaseBackup size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Миграция данных</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Загрузить статику (2023-2026) в Firebase</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleMigration} disabled={isMigrating}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: isMigrating ? 'not-allowed' : 'pointer', opacity: isMigrating ? 0.7 : 1, width: isMobile ? '100%' : 'auto' }}
                    >
                      {isMigrating ? 'Выгрузка в облако...' : 'Запустить миграцию'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default App;