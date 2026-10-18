// Seis temas: variables de color de cada uno; sin almacenamiento o con un tema guardado inválido debe quedar en Claro.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() !== 'log') errs.push(m.type() + ' ' + m.text().slice(0, 120)); });
  await p.goto('file://' + process.argv[2]); await p.waitForSelector('header.tv-header');
  const r = await p.evaluate(() => { const st = document.getElementById('tv-temas'); const out = { reglas: st ? st.textContent.split('\n').length : 0, largo: st ? st.textContent.length : 0, temas: {} };
    for (const k of Object.keys(TEMAS)) { document.documentElement.setAttribute('data-tema', k); const cs = getComputedStyle(document.documentElement);
      out.temas[k] = ['--c-bg', '--c-panel', '--c-accent', '--c-btn-accent', '--bFFFFFF', '--b0F172A', '--t0369A1', '--b0369A1', '--lE2E8F0', '--tv-foco'].map(v => v + '=' + cs.getPropertyValue(v).trim()).join(' '); }
    return out; });
  console.log(JSON.stringify(r, null, 1));
  // sin almacenamiento: el tema por defecto y la app abre
  const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); await p2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } }); });
  const e2 = []; p2.on('pageerror', e => e2.push(e.message)); await p2.goto('file://' + process.argv[2]); await p2.waitForTimeout(1500);
  console.log('sin localStorage → tema:', await p2.evaluate(() => document.documentElement.dataset.tema), '| errores:', e2.length ? e2.slice(0, 2) : 'ninguno');
  // valor guardado inválido
  await p.evaluate(() => localStorage.setItem('tv_tema', 'inventado')); await p.reload(); await p.waitForSelector('header.tv-header');
  console.log('tema guardado inválido → ', await p.evaluate(() => document.documentElement.dataset.tema));
  console.log(errs.join('\n') || 'consola limpia'); await b.close(); })();
