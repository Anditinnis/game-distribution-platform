// src/utils/format.js

/**
 * Безопасное форматирование числа с двумя знаками после запятой
 * @param {any} value - значение для форматирования
 * @param {number} defaultValue - значение по умолчанию (0.00)
 * @returns {string} отформатированное число
 */
export const safeToFixed = (value, defaultValue = '0.00') => {
  // Если значение null или undefined
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // Если это уже строка, пробуем преобразовать
  if (typeof value === 'string') {
    // Убираем все символы кроме цифр, точки и минуса
    const cleanStr = value.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? defaultValue : num.toFixed(2);
  }
  
  // Если это число
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  
  // Если это объект с valueOf
  if (value && typeof value.valueOf === 'function') {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num.toFixed(2);
  }
  
  console.warn('safeToFixed: неизвестный тип', typeof value, value);
  return defaultValue;
};

/**
 * Безопасное форматирование даты
 */
export const safeFormatDate = (dateString, locale = 'ru-RU') => {
  if (!dateString) return 'Не указана';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Не указана';
    
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Не указана';
  }
};