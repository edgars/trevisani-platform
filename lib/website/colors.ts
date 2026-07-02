/**
 * Converte uma cor HEX para os componentes HSL (sem unidades).
 * Retorna uma string "H S% L%" pronta para uso em CSS variables HSL.
 *
 * Exemplo: "#e11d48" → "346 87% 43%"
 */
export function hexToHslString(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Gera o bloco de CSS variables para a vitrine de um tenant.
 * Injeta como <style> inline no layout da vitrine.
 */
export function buildSiteStyles(corPrimaria: string, corDestaque: string): string {
  const primary = hexToHslString(corPrimaria);
  const accent = hexToHslString(corDestaque);

  return `
    :root {
      --site-primary: ${primary};
      --site-primary-fg: 0 0% 98%;
      --site-accent: ${accent};
      --site-accent-fg: 0 0% 98%;
    }
  `.trim();
}
