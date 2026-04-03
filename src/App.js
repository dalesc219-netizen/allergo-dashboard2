import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';
import {
  Microscope, TrendingUp, Leaf, TreeDeciduous, TreePine,
  MessageCircle, BarChart2, Sun, Calendar, Plus, CloudRain
} from 'lucide-react';
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
import WeatherWidget from './WeatherWidget';
import AddDataModal from './AddDataModal';
import LoginScreen from './LoginScreen';
import WeatherContextChart from './WeatherContextChart';
import { useMeasurements } from './useMeasurements';

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
  "03-24": { alder: 0, birch: 0, oak: 0, alder_2026: 16, hazel_2026: 19, birch_2026: 1 },
  "03-25": { alder: 0, birch: 0, oak: 0, alder_2026: 21, hazel_2026: 32, birch_2026: 1 },
  "03-26": { alder: 0, birch: 0, oak: 0, alder_2026: 207, hazel_2026: 166, birch_2026: 1 },
  "03-27": { alder: 0, birch: 0, oak: 0, alder_2026: null, hazel_2026: null, birch_2026: null },
  "03-24_2023": { alder: 0, birch: 0, oak: 0, alder_2023: 122, hazel_2023: 33 },
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
  "03-01": { tempMin: -7.2, tempMax: -3.6, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-02": { tempMin: +0.6, tempMax: +3.6, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-03": { tempMin: +0.6, tempMax: +1.7, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-04": { tempMin: -1.4, tempMax: +1.5, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-05": { tempMin: +0.4, tempMax: +1.8, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-06": { tempMin: -4.4, tempMax: -0.1, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-07": { tempMin: -3.4, tempMax: +3.1, windSpeedMax: 1, precip: 0.0, windDir: "СЗ" },
  "03-08": { tempMin: -0.6, tempMax: +4.0, windSpeedMax: 1, precip: 0.0, windDir: "ЮЗ" },
  "03-09": { tempMin: -6.1, tempMax: +1.6, windSpeedMax: 1, precip: 0.0, windDir: "Ю" },
  "03-10": { tempMin: +2.7, tempMax: +9.4, windSpeedMax: 1, precip: 0.0, windDir: "Ю" },
  "03-11": { tempMin: +1.0, tempMax: +12.0, windSpeedMax: 1, precip: 0.0, windDir: "ЮЗ" },
  "03-12": { tempMin: +2.7, tempMax: +12.4, windSpeedMax: 1, precip: 0.0, windDir: "Ю" },
  "03-13": { tempMin: +3.9, tempMax: +13.8, windSpeedMax: 1, precip: 0.0, windDir: "Ю" },
  "03-14": { tempMin: -0.4, tempMax: +12.7, windSpeedMax: 1, precip: 0.0, windDir: "Ю" },
  "03-15": { tempMin: +1.7, tempMax: +10.3, windSpeedMax: 2, precip: 0.0, windDir: "Ю" },
  "03-16": { tempMin: -2.3, tempMax: +9.2, windSpeedMax: 2, precip: 0.0, windDir: "ЮВ" },
  "03-17": { tempMin: -2.8, tempMax: +10.3, windSpeedMax: 1, precip: 0.0, windDir: "ЮВ" },
  "03-18": { tempMin: +1.0, tempMax: +10.9, windSpeedMax: 1, precip: 0.0, windDir: "ЮВ" },
  "03-19": { tempMin: -2.1, tempMax: +11.3, windSpeedMax: 1, precip: 0.0, windDir: "ЮВ" },
  "03-20": { tempMin: +0.5, tempMax: +10.6, windSpeedMax: 1, precip: 0.0, windDir: "ЮВ" },
  "03-21": { tempMin: +2.0, tempMax: +8.8, windSpeedMax: 2, precip: 0.0, windDir: "В" },
  "03-22": { tempMin: -1.3, tempMax: +11.7, windSpeedMax: 1, precip: 0.0, windDir: "В" },
  "03-23": { tempMin: -1.1, tempMax: +12.6, windSpeedMax: 1, precip: 0.0, windDir: "В" },
  "03-24": { tempMin: +1.4, tempMax: +12.5, windSpeedMax: 1, precip: 0.0, windDir: "СВ" },
  "03-25": { tempMin: -0.2, tempMax: +13.0, windSpeedMax: 1, precip: 0.0, windDir: "СВ" },
  "03-26": { tempMin: +0.6, tempMax: +12.1, windSpeedMax: 2, precip: 0.0, windDir: "СВ" },
  "03-27": { tempMin: 3.4, tempMax: 9.5, windSpeedMax: 2, precip: 0.0, windDir: "С" },
  "03-28": { tempMin: +4.8, tempMax: +14.3, windSpeedMax: 1, precip: 0.0, windDir: "СВ" },
  "03-29": { tempMin: +6.2, tempMax: +16.7, windSpeedMax: 2, precip: 0.0, windDir: "В" },
  "03-30": { tempMin: +2.9, tempMax: +17.0, windSpeedMax: 2, precip: 0.0, windDir: "В" },
  "03-31": { tempMin: +6.8, tempMax: +17.5, windSpeedMax: 2, precip: 0.8, windDir: "В", phenomena: ["дождь"] }
};

const ARCHIVE_SUMMER_2023 = {
  "06-20": { grass: 5, weed: 0, clado: 1830, alt: 130 },
  "07-04": { grass: 27, weed: 0, clado: 6190, alt: 310 },
  "07-06": { grass: 12, weed: 21, clado: 10250, alt: 1220 },
  "08-07": { grass: 7, weed: 130, clado: 7035, alt: 552 },
  "08-15": { grass: 11, weed: 72, clado: 8453, alt: 2 },
  "09-01": { grass: 0, weed: 22, clado: 8902, alt: 600 },
  "09-04": { grass: 0, weed: 11, clado: 5051, alt: 71 },
  "09-11": { grass: 0, weed: 0, clado: 4051, alt: 41 },
  "09-13": { grass: 0, weed: 0, clado: 4008, alt: 0 }
};

const STATIC_SUMMARY = [
  { year: 2026, status: "Март: Ольха активна (220)", level: "high" },
  { year: 2025, status: "Пик березы 20 апр (14403)", level: "critical" },
  { year: 2024, status: "Умеренный фон", level: "warning" },
  { year: 2023, status: "Пик березы 21 апр (11206)", level: "critical" }
];

const colorMap = { 'safe': '#32D74B', 'warning': '#FFD60A', 'high': '#FF9F0A', 'critical': '#FF453A', 'burgundy': '#8A0303' };

const HUMIDITY_MARCH_2026 = {
  "2026-03-01": 96, "2026-03-02": 94, "2026-03-03": 92, "2026-03-04": 74, "2026-03-05": 93,
  "2026-03-06": 94, "2026-03-07": 71, "2026-03-08": 79, "2026-03-09": 65, "2026-03-10": 77,
  "2026-03-11": 74, "2026-03-12": 58, "2026-03-13": 58, "2026-03-14": 49, "2026-03-15": 75,
  "2026-03-16": 63, "2026-03-17": 38, "2026-03-18": 32, "2026-03-19": 56, "2026-03-20": 51,
  "2026-03-21": 43, "2026-03-22": 55, "2026-03-23": 70, "2026-03-24": 40, "2026-03-25": 65,
  "2026-03-26": 64, "2026-03-27": 45, "2026-03-28": 41, "2026-03-29": 42, "2026-03-30": 48,
  "2026-03-31": 32
};

const HUMIDITY_APRIL_2024 = {
  "2024-04-01": 30, "2024-04-02": 42, "2024-04-03": 74, "2024-04-04": 74, "2024-04-05": 68,
  "2024-04-06": 66, "2024-04-07": 60, "2024-04-08": 61, "2024-04-09": 62, "2024-04-10": 62,
  "2024-04-11": 44, "2024-04-12": 57, "2024-04-13": 77, "2024-04-14": 80, "2024-04-15": 59,
  "2024-04-16": 72, "2024-04-17": 59, "2024-04-18": 86, "2024-04-19": 68, "2024-04-20": 88,
  "2024-04-21": 80, "2024-04-22": 46, "2024-04-23": 68, "2024-04-24": 59, "2024-04-25": 44,
  "2024-04-26": 88, "2024-04-27": 90, "2024-04-28": 40, "2024-04-29": 29, "2024-04-30": 34
};

const HUMIDITY_MARCH_2024 = {
  "2024-03-01": 70, "2024-03-02": 72, "2024-03-03": 41, "2024-03-04": 46, "2024-03-05": 55,
  "2024-03-06": 36, "2024-03-07": 39, "2024-03-08": 73, "2024-03-09": 47, "2024-03-10": 50,
  "2024-03-11": 51, "2024-03-12": 44, "2024-03-13": 43, "2024-03-14": 40, "2024-03-15": 55,
  "2024-03-16": 59, "2024-03-17": 65, "2024-03-18": 76, "2024-03-19": 77, "2024-03-20": 36,
  "2024-03-21": 21, "2024-03-22": 34, "2024-03-23": 89, "2024-03-24": 93, "2024-03-25": 59,
  "2024-03-26": 47, "2024-03-27": 39, "2024-03-28": 37, "2024-03-29": 62, "2024-03-30": 49,
  "2024-03-31": 69
};

const HUMIDITY_MAY_2024 = {
  "2024-05-01": 29, "2024-05-02": 47, "2024-05-03": 22, "2024-05-04": 25, "2024-05-05": 52,
  "2024-05-06": 58, "2024-05-07": 90, "2024-05-08": 47, "2024-05-09": 41, "2024-05-10": 42,
  "2024-05-11": 35, "2024-05-12": 52, "2024-05-13": 42, "2024-05-14": 44, "2024-05-15": 38,
  "2024-05-16": 36, "2024-05-17": 40, "2024-05-18": 29, "2024-05-19": 30, "2024-05-20": 31,
  "2024-05-21": 40, "2024-05-22": 25, "2024-05-23": 28, "2024-05-24": 27, "2024-05-25": 23,
  "2024-05-26": 44, "2024-05-27": 32, "2024-05-28": 25, "2024-05-29": 27, "2024-05-30": 27,
  "2024-05-31": 30
};

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

function App() {
  // Состояния для экрана блокировки
  const [locked, setLocked] = useState(true);
  const [role, setRole] = useState(null); // 'admin', 'editor', 'viewer'
  
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Получаем данные и функции из хука
  const { isLoading, historyData: dbHistoryData, latestData: dbLatestData, fetchMeasurements } = useMeasurements();

  // Определяем тип устройства
  const isMobile = useIsMobile();

  // Fallback: Если в БД пока нет записей пыльцы, подставляем демо-данные (ARCHIVE_2026_DATA)
  const historyData = dbHistoryData.length > 0 
    ? dbHistoryData 
    : Object.entries(ARCHIVE_2026_DATA).map(([date, data]) => ({ date, ...data })).reverse();
  const latestData = dbLatestData || historyData[0];

  // UI Состояния
  const [activeTab, setActiveTab] = useState(0);
  const viewsRef = useRef(null);
  const [todayScaleType, setTodayScaleType] = useState('linear');
  const [archiveRange, setArchiveRange] = useState('season'); // season, month, week
  const [archivePollenChartType, setArchivePollenChartType] = useState('bar'); // 'bar' or 'line'
  const [archivePollenScaleType, setArchivePollenScaleType] = useState('logarithmic'); // 'linear' or 'logarithmic'
  const [hiddenDatasetsToday, setHiddenDatasetsToday] = useState({});
  const [hiddenDatasetsArchive, setHiddenDatasetsArchive] = useState({
    'Ольха (2023)': true, 'Орешник (2023)': true, 'Береза (2023)': true, 'Береза (2024)': true
  });
  

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
      viewsRef.current.scrollTo({ left: index * viewsRef.current.clientWidth, behavior: 'smooth' });
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
    const total = (data.alder || 0) + (data.hazel || 0) + (data.birch || 0) + (data.oak || 0);
    if (data.birch > 800 || total > 1000) return { level: 'critical', label: 'КРИТИЧЕСКИЙ', color: 'var(--critical)', bg: 'rgba(255, 69, 58, 0.15)' };
    if (data.alder > 300 || data.hazel > 150 || total > 400) return { level: 'high', label: 'ВЫСОКИЙ', color: 'var(--high)', bg: 'rgba(255, 159, 10, 0.15)' };
    if (total > 50) return { level: 'warning', label: 'СРЕДНИЙ', color: 'var(--warning)', bg: 'rgba(255, 214, 10, 0.15)' };
    if (total > 10) return { level: 'safe', label: 'НИЗКИЙ', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
    return { level: 'safe', label: 'БЕЗОПАСНО', color: 'var(--safe)', bg: 'rgba(50, 215, 75, 0.15)' };
  };
  const currentRisk = getRiskLevel(latestData);

  // Открытие модального окна в режиме редактирования
  const openEditModal = (item) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  // --- ДАННЫЕ ГРАФИКА: СЕГОДНЯ ---
  const todayChartData = {
    labels: historyData.slice(0, 7).reverse().map(d => `${parseInt(d.date.split('-')[2], 10)} ${formatMonth(d.date.split('-')[1])}`),
    datasets: [
      { label: 'Ольха', data: historyData.slice(0, 7).reverse().map(d => d.alder || null), borderColor: '#32D74B', backgroundColor: 'rgba(50,215,75,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Орешник', data: historyData.slice(0, 7).reverse().map(d => d.hazel || null), borderColor: '#FFD60A', backgroundColor: 'rgba(255,214,10,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Береза', data: historyData.slice(0, 7).reverse().map(d => d.birch || null), borderColor: '#FF453A', backgroundColor: 'rgba(255,69,58,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 },
      { label: 'Дуб', data: historyData.slice(0, 7).reverse().map(d => d.oak || null), borderColor: '#8A0303', backgroundColor: 'rgba(138,3,3,0.2)', fill: true, tension: 0.4, pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5 }
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
          return context.parsed.y > 0;
        }
      }
    }
  };

  // --- ДАННЫЕ ГРАФИКА: АРХИВ ---
  const filteredArchiveKeys = useMemo(() => {
    const allKeys = Object.keys(ARCHIVE_2025);
    const now = new Date();

    if (archiveRange === 'season') {
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
  }, [archiveRange]);

  const archiveLabels = filteredArchiveKeys.map(k => `${parseInt(k.split('-')[1], 10)} ${formatMonth(k.split('-')[0])}`);

  const buildPollenDataset = (label, key, color, isHidden, chartType, isMobile) => {
    const baseDataset = {
      label,
      data: filteredArchiveKeys.map(k => ARCHIVE_2025[k]?.[key] || null),
      hidden: isHidden,
      type: chartType,
    };

    if (chartType === 'bar') {
      return {
        ...baseDataset,
        backgroundColor: color,
        borderRadius: 4,
      };
    } else { // 'line'
      return {
        ...baseDataset,
        borderColor: color,
        backgroundColor: 'transparent', // No fill for lines by default
        fill: false,
        tension: 0.4,
        pointRadius: isMobile ? 1.5 : 4, pointHoverRadius: isMobile ? 3 : 6, borderWidth: isMobile ? 1.5 : 2.5,
      };
    }
  };
  
  const archiveChartData = {
    labels: archiveLabels,
    datasets: [
      buildPollenDataset('Ольха (2026)', 'alder_2026', '#64D2FF', !!hiddenDatasetsArchive['Ольха (2026)'], archivePollenChartType, isMobile),
      buildPollenDataset('Ольха (2025)', 'alder', '#FF9F0A', !!hiddenDatasetsArchive['Ольха (2025)'], archivePollenChartType, isMobile),
      buildPollenDataset('Ольха (2023)', 'alder_2023', '#FFD60A', !!hiddenDatasetsArchive['Ольха (2023)'], archivePollenChartType, isMobile),

      buildPollenDataset('Орешник (2026)', 'hazel_2026', '#FFD60A', !!hiddenDatasetsArchive['Орешник (2026)'], archivePollenChartType, isMobile),
      buildPollenDataset('Орешник (2025)', 'hazel', '#E5C07B', !!hiddenDatasetsArchive['Орешник (2025)'], archivePollenChartType, isMobile),
      buildPollenDataset('Орешник (2023)', 'hazel_2023', '#EBEBF599', !!hiddenDatasetsArchive['Орешник (2023)'], archivePollenChartType, isMobile),

      buildPollenDataset('Береза (2026)', 'birch_2026', '#BF5AF2', !!hiddenDatasetsArchive['Береза (2026)'], archivePollenChartType, isMobile),
      buildPollenDataset('Береза (2025)', 'birch', '#FF453A', !!hiddenDatasetsArchive['Береза (2025)'], archivePollenChartType, isMobile),
      buildPollenDataset('Береза (2024)', 'birch_2024', '#FF8A65', !!hiddenDatasetsArchive['Береза (2024)'], archivePollenChartType, isMobile),
      buildPollenDataset('Береза (2023)', 'birch_2023', '#32D74B', !!hiddenDatasetsArchive['Береза (2023)'], archivePollenChartType, isMobile),

      buildPollenDataset('Дуб (2025)', 'oak', '#0A84FF', !!hiddenDatasetsArchive['Дуб (2025)'], archivePollenChartType, isMobile)
    ]
  };

  const summerArchiveChartData = {
    labels: Object.keys(ARCHIVE_SUMMER_2023).map(k => `${parseInt(k.split('-')[1])} ${formatMonth(k.split('-')[0])}`),
    datasets: [
      { label: 'Злаки', data: Object.values(ARCHIVE_SUMMER_2023).map(v => v.grass || null), backgroundColor: '#FFD60A', borderRadius: 4 },
      { label: 'Сорные', data: Object.values(ARCHIVE_SUMMER_2023).map(v => v.weed || null), backgroundColor: '#32D74B', borderRadius: 4 },
      { label: 'Кладоспориум', data: Object.values(ARCHIVE_SUMMER_2023).map(v => v.clado || null), backgroundColor: '#BF5AF2', borderRadius: 4 },
      { label: 'Альтернария', data: Object.values(ARCHIVE_SUMMER_2023).map(v => v.alt || null), backgroundColor: '#FF453A', borderRadius: 4 }
    ]
  };

  const xAxisTicksConfig = {
    maxRotation: 0,
    autoSkip: true,
    maxTicksLimit: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    font: { size: 10 }
  };


  // Компонент кастомной легенды (одинаков для обоих графиков)
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

    return (
      <div className="custom-legend-container">
        {Object.entries(groups)
          .sort(([a], [b]) => {
            let iA = groupOrder.indexOf(a); if (iA === -1) iA = 99;
            let iB = groupOrder.indexOf(b); if (iB === -1) iB = 99;
            return iA - iB;
          })
          .map(([groupName, items]) => (
          <div className="legend-group" key={groupName}>
            <div className="legend-group-title">{groupName}</div>
            {items
              .sort((a, b) => {
                const yearA = parseInt(a.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
                const yearB = parseInt(b.label.match(/\((\d{4})\)/)?.[1] || 0, 10);
                return yearB - yearA;
              })
              .map(ds => (
              <div 
                key={ds.label} 
                className={`legend-item${hiddenState[ds.label] ? ' hidden-dataset' : ''}`}
                onClick={() => toggleFn(ds.label)}
              >
                <div className="legend-color-box" style={{ backgroundColor: ds.borderColor || ds.backgroundColor }}></div>
                <span>{isArchive ? (ds.label.match(/\((\d{4})\)/)?.[1] || ds.label) : ds.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* ЭКРАН БЛОКИРОВКИ */}
      <LoginScreen 
        isLocked={locked} 
        onUnlock={(assignedRole) => { setRole(assignedRole); setLocked(false); }} 
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
          {/* ФИКСИРОВАННАЯ ШАПКА */}
          <header className="header">
            <div className="header-top">
              <h1 className="app-title">Москва <span className="date-text">{new Date().toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'}).replace(' г.', '')}</span></h1>
              <WeatherWidget />
            </div>
            
            <div className="segment-control">
              <div className="segment-indicator" style={{ transform: `translateX(${activeTab * 100}%)` }}></div>
              <button className={`segment-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => switchTab(0)}>СЕГОДНЯ</button>
              <button className={`segment-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => switchTab(1)}>АРХИВ</button>
            </div>
          </header>

          <div className="views-wrapper" ref={viewsRef} onScroll={handleScroll}>
            
            {/* VIEW 1: TODAY */}
            <div className="view-pane">
              {!latestData ? (
                <div className="empty-state">Данных с ловушек за сегодня пока нет 🤷‍♂️</div>
              ) : (
                <div className="card">
                  <div className="risk-header" style={{ marginBottom: 15, alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="section-title" style={{ marginBottom: 2 }}><Microscope size={18} /> Данные ловушек</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 26 }}>Дата измерений: {latestData.date.split('-').reverse().join('.')}</div>
                    </div>
                    <div className={`risk-badge ${currentRisk.level === 'high' || currentRisk.level === 'critical' ? 'breathe-effect' : ''}`} style={{ background: currentRisk.bg, color: currentRisk.color, '--breathe-color': currentRisk.color }}>
                      {currentRisk.label}
                    </div>
                  </div>
                  <div className="pollen-list">
                    {[{id: 'alder', name: 'Ольха', icon: TreeDeciduous}, {id: 'hazel', name: 'Орешник', icon: Leaf}, {id: 'birch', name: 'Береза', icon: TreePine}, {id: 'oak', name: 'Дуб', icon: TreeDeciduous}].map(item => {
                       const val = latestData[item.id];
                       const isNull = val === null || val === undefined;
                       const itemRisk = isNull ? {color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)'} : getRiskLevel({[item.id]: val});
                       return (
                         <div className="pollen-item" key={item.id} style={{ opacity: isNull ? 0.7 : 1 }}>
                           <div className="pollen-left">
                             <div className="pollen-icon-wrapper" style={{ background: itemRisk.bg, color: itemRisk.color }}>
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

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <h3 className="section-title" style={{ margin: 0 }}><TrendingUp size={18} /> Динамика ловушек</h3>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="segment-control" style={{ width: 90, padding: 2, flexShrink: 0, height: 26 }}>
                      <div className="segment-indicator" style={{ transform: `translateX(${todayScaleType === 'linear' ? 0 : 100}%)`, width: 'calc(50% - 2px)' }}></div>
                      <button className={`segment-btn ${todayScaleType==='linear'?'active':''}`} onClick={() => setTodayScaleType('linear')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LIN</button>
                      <button className={`segment-btn ${todayScaleType==='logarithmic'?'active':''}`} onClick={() => setTodayScaleType('logarithmic')} style={{ fontSize: 10, padding: 0, lineHeight: '22px' }}>LOG</button>
                    </div>
                    {role !== 'viewer' && (
                      <button className="add-data-btn" onClick={() => { setEditData(null); setIsModalOpen(true); }}><Plus size={18} /></button>
                    )}
                  </div>
                </div>

                <CustomLegend datasets={todayChartData.datasets} hiddenState={hiddenDatasetsToday} toggleFn={(lbl) => setHiddenDatasetsToday(p => ({...p, [lbl]: !p[lbl]}))} isArchive={false} />

                <div className="chart-container">
                  <Line data={activeTodayChartData} options={{...chartOptionsCommon, scales: { x: { grid: { display: false }, ticks: {color: '#EBEBF599'}}, y: { type: todayScaleType, min: todayScaleType === 'logarithmic' ? 0.5 : 0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {color: '#EBEBF599', callback: (v) => (todayScaleType === 'logarithmic' ? ([1,10,100,1000,10000].includes(v) ? v : null) : v)} }}}} />
                </div>
              </div>

              {/* ИНСАЙТЫ (Отзывы пользователей) */}
              <div className="card">
                <h3 className="section-title">
                  <MessageCircle size={18} /> Инсайты (VK Pollen Club)
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                  Свежие комментарии из Москвы о текущей обстановке.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div className="insight-comment">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Антон М.</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Сегодня, 08:30</span>
                    </div>
                    Ольха вернулась с новыми силами (207). Вчера было нормально, а сегодня утром проснулся с заложенным носом и отекшими глазами.
                  </div>

                  <div className="insight-comment">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Елена В.</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Вчера, 21:15</span>
                    </div>
                    Орешник тоже не отстает (166). Ветер разносит пыльцу, на улице без очков и маски делать нечего, всё сразу чешется.
                  </div>

                  <div className="insight-comment">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Мария С.</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Вчера, 18:20</span>
                    </div>
                    Берёза пока на единичке, но с таким потеплением, думаю, скоро начнется. Пьем антигистаминные заранее.
                  </div>

                </div>
              </div>
            </div>

            {/* VIEW 2: ARCHIVE */}
            <div className="view-pane">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                  {/* Левая часть: Заголовок */}
                  <div style={{ minWidth: '200px' }}>
                    <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart2 size={18} /> Сравнение сезонов
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 26px' }}>Эстафета аллергенов: Деревья</p>
                  </div>

                  {/* Правая часть: Контролы */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* 1. Фильтр периода */}
                    <div className="segment-control" style={{ width: 160, padding: 2, height: 28, flexShrink: 0 }}>
                      <div className="segment-indicator" style={{ width: 'calc(33.33% - 2px)', transform: `translateX(${archiveRange === 'season' ? 0 : (archiveRange === 'month' ? 100 : 200)}%)` }}></div>
                      <button className={`segment-btn ${archiveRange === 'season' ? 'active' : ''}`} onClick={() => setArchiveRange('season')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Сезон</button>
                      <button className={`segment-btn ${archiveRange === 'month' ? 'active' : ''}`} onClick={() => setArchiveRange('month')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Месяц</button>
                      <button className={`segment-btn ${archiveRange === 'week' ? 'active' : ''}`} onClick={() => setArchiveRange('week')} style={{ fontSize: 10, padding: 0, lineHeight: '24px' }}>Неделя</button>
                    </div>

                    {/* Разделитель */}
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }}></div>

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
                
                <CustomLegend datasets={archiveChartData.datasets} hiddenState={hiddenDatasetsArchive} toggleFn={(lbl) => setHiddenDatasetsArchive(p => ({...p, [lbl]: !p[lbl]}))} isArchive={true} />

                <div className="chart-container">
                  {archivePollenChartType === 'bar' ? (
                    <Bar data={archiveChartData} options={{...chartOptionsCommon, barPercentage: 0.9, categoryPercentage: 0.8, scales: { x: { grid: { display: false }, ticks: xAxisTicksConfig }, y: { type: archivePollenScaleType, min: archivePollenScaleType === 'logarithmic' ? 0.5 : 0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {color: '#EBEBF599', callback: (v) => (archivePollenScaleType === 'logarithmic' ? ([1,10,100,1000,10000].includes(v) ? v : null) : v)} }}}} />
                  ) : (
                    <Line data={archiveChartData} options={{...chartOptionsCommon, scales: { x: { grid: { display: false }, ticks: xAxisTicksConfig }, y: { type: archivePollenScaleType, min: archivePollenScaleType === 'logarithmic' ? 0.5 : 0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {color: '#EBEBF599', callback: (v) => (archivePollenScaleType === 'logarithmic' ? ([1,10,100,1000,10000].includes(v) ? v : null) : v)} }}}} />
                  )}
                </div>
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

              <div className="card">
                <h3 className="section-title"><Sun size={18} /> Летне-осенний сезон (2023)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Злаки, сорные травы и плесневые грибы.</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 15 }}>* Кладоспориум достигает 10 000+ ед., используется логарифмическая шкала.</p>
                <div className="chart-container">
                  <Bar data={summerArchiveChartData} options={{...chartOptionsCommon, plugins: { ...chartOptionsCommon.plugins, legend: { display: true, position: 'top', labels: { color: 'rgba(235,235,245,0.6)', usePointStyle: true, boxWidth: 8 } } }, scales: { x: { grid: { display: false }, ticks: {color: '#EBEBF599'} }, y: { type: 'logarithmic', min: 0.5, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {color: '#EBEBF599', callback: (v) => ([1,10,100,1000,10000].includes(v) ? v : null)} }}}} />
                </div>
              </div>

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
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;