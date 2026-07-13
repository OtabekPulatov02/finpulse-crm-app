import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/* Небольшой индикатор перехода между страницами — как в большинстве SPA
   (аналог NProgress). Сама навигация в React Router происходит
   синхронно, так что тут нет реального "прогресса" загрузки — это
   намеренно короткая, приятная анимация, дающая понятную обратную связь,
   что переход произошёл, а не подвисло. */
export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<number[]>([]);

  /* Показываем и на самой первой отрисовке тоже — пользователь просил
     индикатор и на переходах, и на обновлении страницы (F5), а это и
     есть тот самый первый рендер. */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setVisible(true);
    setWidth(0);
    timers.current = [
      window.setTimeout(() => setWidth(40), 20),
      window.setTimeout(() => setWidth(70), 120),
      window.setTimeout(() => setWidth(90), 260),
      window.setTimeout(() => setWidth(100), 360),
      window.setTimeout(() => setVisible(false), 560),
    ];
    return () => { timers.current.forEach(clearTimeout); };
  }, [location.pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${width}%`, opacity: visible ? 1 : 0, boxShadow: visible ? "0 0 8px rgba(37,99,235,0.6)" : "none" }}
      />
    </div>
  );
}
