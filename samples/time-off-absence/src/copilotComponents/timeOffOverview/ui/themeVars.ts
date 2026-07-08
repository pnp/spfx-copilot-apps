// Converts a Fluent v9 Theme object into inline CSS custom properties.
//
// This is the heart of the styling fix for the SPFx Copilot host. Fluent v9
// normally delivers its design tokens by having FluentProvider inject a <style>
// tag into targetDocument.head and calling sheet.insertRule(...) from a
// useInsertionEffect. In the Copilot host (a sandboxed iframe, running on a
// React 17 runtime that has no useInsertionEffect) that programmatic injection
// silently no-ops, so every `var(--token)` the components reference resolves to
// nothing — serif font, no colors, no spacing, no card chrome.
//
// Fluent's own createCSSRuleFromTheme emits `--${key}: ${value}` for every key
// in the theme. We replicate that mapping here, but return it as a React style
// object so the caller can apply the variables INLINE on an ancestor element.
// CSS custom properties inherit, so the whole subtree's `var(--token)` lookups
// resolve via plain cascade — with zero dependency on head injection,
// insertRule, CSP, the iframe boundary, or which document was targeted.
import type { CSSProperties } from 'react';
import type { Theme } from '@fluentui/react-components';

export function themeToCssVars(theme: Theme): CSSProperties {
  const vars: Record<string, string> = {};
  (Object.keys(theme) as Array<keyof Theme>).forEach((key) => {
    const value = theme[key];
    if (value !== undefined && value !== null) {
      vars[`--${String(key)}`] = String(value);
    }
  });
  return vars as CSSProperties;
}
