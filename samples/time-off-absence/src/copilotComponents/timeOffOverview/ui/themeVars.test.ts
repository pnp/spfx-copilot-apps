import type { Theme } from '@fluentui/react-components';
import { webLightTheme } from '@fluentui/react-theme';

import { themeToCssVars } from './themeVars';

describe('themeToCssVars', () => {
  it('maps every theme key to a "--key" CSS custom property', () => {
    const theme = {
      colorNeutralBackground1: '#ffffff',
      fontFamilyBase: "'Segoe UI', sans-serif",
      fontSizeHero800: '32px',
      spacingHorizontalL: '16px'
    } as unknown as Theme;

    const vars = themeToCssVars(theme) as Record<string, string>;

    expect(vars['--colorNeutralBackground1']).toBe('#ffffff');
    expect(vars['--fontFamilyBase']).toBe("'Segoe UI', sans-serif");
    expect(vars['--fontSizeHero800']).toBe('32px');
    expect(vars['--spacingHorizontalL']).toBe('16px');
    expect(Object.keys(vars)).toHaveLength(4);
  });

  it('stringifies numeric token values such as font weights', () => {
    const theme = { fontWeightSemibold: 600 } as unknown as Theme;

    const vars = themeToCssVars(theme) as Record<string, string>;

    expect(vars['--fontWeightSemibold']).toBe('600');
  });

  it('skips null/undefined token values', () => {
    const theme = {
      colorNeutralBackground1: '#fff',
      colorNeutralForeground1: undefined,
      colorNeutralStroke1: null
    } as unknown as Theme;

    const vars = themeToCssVars(theme) as Record<string, string>;

    expect(vars['--colorNeutralBackground1']).toBe('#fff');
    expect('--colorNeutralForeground1' in vars).toBe(false);
    expect('--colorNeutralStroke1' in vars).toBe(false);
  });

  it('produces real Fluent tokens the components depend on from webLightTheme', () => {
    const vars = themeToCssVars(webLightTheme) as Record<string, string>;

    // A representative sample of tokens referenced by the PTO components.
    const sampledTokens = [
      '--colorNeutralBackground1',
      '--colorNeutralBackground2',
      '--fontFamilyBase',
      '--fontSizeHero800',
      '--spacingHorizontalL',
      '--borderRadiusLarge',
      '--shadow2'
    ];
    for (const token of sampledTokens) {
      expect(typeof vars[token]).toBe('string');
      expect(vars[token].length).toBeGreaterThan(0);
    }

    // Numeric tokens are coerced to strings (CSS custom properties are strings).
    expect(vars['--fontWeightSemibold']).toBe(
      String(webLightTheme.fontWeightSemibold)
    );

    // Every emitted key is prefixed with "--" and there are no stray entries.
    expect(Object.keys(vars).length).toBe(Object.keys(webLightTheme).length);
    expect(Object.keys(vars).every((k) => k.startsWith('--'))).toBe(true);
  });
});
