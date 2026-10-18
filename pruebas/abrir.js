// Abre una vía como lo hace la persona: Inicio → obra → vía.
// Las pruebas guardan la vía en localStorage y, al recargar, la app abre en la pantalla de obras
// (una vía guardada sin obra queda en la obra "Mis vías"). Uso: await abrirVia(p, "EJE 7")
module.exports = async function abrirVia(p, nombreVia) {
  await p.waitForSelector('header.tv-header');
  if (await p.locator('.tv-tabs').count()) return;
  if (await p.locator('text=‹ Obras').count()) await p.click('text=‹ Obras');
  await p.locator('main button:has-text("📁 ")').first().click();
  await p.getByText(nombreVia, { exact: true }).first().click();
  await p.waitForSelector('.tv-tabs'); await p.waitForTimeout(200);
};
