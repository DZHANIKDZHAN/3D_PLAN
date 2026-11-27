// Проверка проходимости прогулки от первого лица.
// Запуск: node walk-test.mjs            (рядом с index.html)
//     или node walk-test.mjs путь/к/index.html
// Берёт из index.html константы и логику зон (ZONES, tryMove) и проводит человека по маршруту.
// Если что-то не так, выводит «ОШИБКА» и выходит с кодом 1.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('./index.html', import.meta.url));
const html = fs.readFileSync(file, 'utf8');
const cut = (from, to) => {
  const a = html.indexOf(from), b = html.indexOf(to);
  if (a < 0 || b < 0) throw new Error(`В index.html не найден блок «${from}» … «${to}»`);
  return html.slice(a, b);
};
const code = cut('const S = 0.01;', 'const F1 =') + cut('const EYE = 160', 'function teleport(') +
  '\nreturn { fp, tryMove, H1 };';
const { fp, tryMove, H1 } = new Function(code)();

function go(tx, ty){
  for (let i = 0; i < 3000; i++) {
    const dx = tx - fp.x, dy = ty - fp.y, d = Math.hypot(dx, dy);
    if (d < 1) break;
    const s = Math.min(5, d), bx = fp.x, by = fp.y;
    tryMove(dx / d * s, dy / d * s);
    if (fp.x === bx && fp.y === by) break;
  }
  return { x: Math.round(fp.x), y: Math.round(fp.y), floor: Math.round(fp.foot) };
}

let failed = 0;
function step(label, tx, ty, check){
  const r = go(tx, ty), ok = check(r);
  if (!ok) failed++;
  console.log(`${ok ? 'ок    ' : 'ОШИБКА'} ${label.padEnd(36)} x=${r.x} y=${r.y} пол=${r.floor}`);
}

// Маршрут для Пушкинской. Для нового помещения переписать под его геометрию.
Object.assign(fp, { x: 201, y: -20, foot: 0 });
step('вход → зал 1 этажа', 201, 45, r => r.y === 45 && r.floor === 0);
step('к забежным ступеням у входа', 40, 45, r => r.x === 40 && r.floor > 0);
step('вверх по прямому маршу', 49, 360, r => r.y === 360 && r.floor > 200);
step('на площадку', 49, 405, r => r.y === 405);
step('по верхнему маршу на 2 этаж', 700, 405, r => r.x === 700 && r.floor === H1);
step('по залу 2 этажа', 700, 200, r => r.y === 200 && r.floor === H1);
step('к перилам второго света (стоп)', 100, 200, r => r.x > 260 && r.x < 300);
step('к двери склада', 1017, 400, r => r.x === 1017 && r.y === 400);
step('в склад', 1017, 150, r => r.y === 150);
Object.assign(fp, { x: 200, y: 200, foot: 0 });
step('1 этаж: к перегородке лестницы (стоп)', 0, 200, r => r.x > 110 && r.x < 140 && r.floor === 0);
step('1 этаж: под верхний марш', 200, 430, r => r.y === 430 && r.floor === 0);

if (failed) { console.log(`\nНе прошло проверок: ${failed}`); process.exit(1); }
console.log('\nВсе маршруты проходятся.');
