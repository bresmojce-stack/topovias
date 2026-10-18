// Abre una vía como lo hace la persona: Inicio → obra → vía.
// Las pruebas guardan la vía en localStorage y, al recargar, la app abre en la pantalla de obras
// (una vía guardada sin obra queda en la obra "Mis vías"). Uso: await abrirVia(p, "EJE 7")
module.exports = async function abrirVia(p, nombreVia) {
  await p.waitForSelector('header.tv-header');
  if (await p.locator('.tv-tabs').count()) return;
  if (await p.locator('text=‹ Obras').count()) await p.click('text=‹ Obras');
  await p.locator('main button:has-text("📁 ")').first().click();
  // la tarjeta de la vía puede llevar un ícono delante ("🛣 EJE 5", "🔒 EJE 5")
  const esc = nombreVia.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await p.getByText(new RegExp('(^|\\s)' + esc + '$')).first().click();
  await p.waitForSelector('.tv-tabs'); await p.waitForTimeout(200);
};
