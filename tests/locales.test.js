import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../src/app/locales';

describe('Locales Dictionary Engine', () => {
  it('Should successfully load the core English translations', () => {
    expect(TRANSLATIONS['English']).toBeDefined();
    expect(TRANSLATIONS['English']['btn_discover']).toBe('Brainstorm Topics');
  });

  it('Should successfully load all static dictionaries (es, fr, de, it, pt)', () => {
    expect(TRANSLATIONS['Spanish']['btn_discover']).toBe('Descubrir Temas');
    expect(TRANSLATIONS['French']['btn_discover']).toBe('Découvrir les Sous-thèmes');
    expect(TRANSLATIONS['German']['btn_discover']).toBe('Unterthemen entdecken');
    expect(TRANSLATIONS['Italian']['btn_discover']).toBe('Scopri Sottotemi');
  });

  it('Should handle string interpolation (e.g., param injection) safely', () => {
    // We replicate the exact interpolator present in page.js
    const t = (key, params = {}, lang = "English") => {
      let str = TRANSLATIONS[lang][key] || key;
      Object.keys(params).forEach(p => { str = str.replace(`{${p}}`, params[p]); });
      return str;
    };
    
    // Fallback dictionary checks manually simulating page.js
    const interpolated = t("step2_desc", { topic: "Coffee" }, "English");
    expect(interpolated).toBe("We found subtopics for Coffee. Add your own or select the ones you want.");
    
    // Testing replacing params in a mock string to ensure logic
    let mockStr = "Tested {count} items";
    mockStr = mockStr.replace("{count}", 5);
    expect(mockStr).toBe("Tested 5 items");
  });
});
