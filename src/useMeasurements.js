import { useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const useMeasurements = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [latestData, setLatestData] = useState(null);

  const fetchMeasurements = useCallback(async () => {
    setIsLoading(true);
    try {
      // Создаем запрос, сортируя по дате по возрастанию
      const q = query(collection(db, 'measurements'), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      
      let lastDocData = null;
      let validLatestData = null;
      const history = [];

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push(data); // Сохраняем "сырые" данные для календаря
        lastDocData = data;
        
        // Игнорируем будущие даты (демо-данные 2026), чтобы latestData всегда брал последний реальный замер (вплоть до сегодня)
        if (data.date <= todayStr) {
          validLatestData = data;
        }
      });

      setLatestData(validLatestData || lastDocData);
      
      setHistoryData(history.reverse()); // Для календаря выводим новые даты сверху
    } catch (e) {
      console.error("Ошибка при загрузке графиков:", e);
    } finally {
      setIsLoading(false);
    }
  }, []); // Используем useCallback, чтобы функция не пересоздавалась при каждом рендере

  return { isLoading, historyData, latestData, fetchMeasurements };
};