/* Единое форматирование номера телефона для отображения — везде, где
   номер показывается человеку (таблицы, карточки, профиль), а не только
   там, где он вводится/хранится. Хранение и API по-прежнему используют
   исходный формат ("+998935678654"), эта функция — только для UI. */
export function formatPhone(raw?: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  // Узбекистан: +998 XX XXX XX XX (код страны 3 + код оператора 2 + 7 цифр номера)
  if (digits.length === 12 && digits.startsWith("998")) {
    const cc = digits.slice(0, 3);
    const op = digits.slice(3, 5);
    const p1 = digits.slice(5, 8);
    const p2 = digits.slice(8, 10);
    const p3 = digits.slice(10, 12);
    return `+${cc} ${op} ${p1} ${p2} ${p3}`;
  }

  // Уже замаскированный ("+998 *** ** 54") или нестандартный формат — не трогаем
  return raw;
}
