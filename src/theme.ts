import { alpha, createTheme, DEFAULT_THEME, ScrollArea, type CSSVariablesResolver } from '@mantine/core';
import type { Status } from './types';

// Text and status colors, each checked for at least 4.5:1 contrast (WCAG 2.1 AA) against
// white, the canvas and inset surfaces, and brand.0.
// One secondary gray for labels, details, hints, table headers and placeholders. It is Mantine's
// "dimmed" color: use c="dimmed". (A second, near-identical gray was merged into it.)
// Disabled text uses the same gray, not Mantine's gray.5 (about 2:1), so a disabled control's
// label stays readable at 4.5:1 on white, the canvas and the disabled button fill.
const TEXT = {
  secondary: '#4F5966',
  disabled: '#4F5966',
  nav: DEFAULT_THEME.white,
};
// Surface levels: page canvas < white cards (Mantine's body color) > recessed inset areas
// (toolbars, table headers, nested rows). Every text color above stays at 4.5:1 on both.
// The nav bar is dark, with white text (about 13:1).
const SURFACE = {
  canvas: '#FCFCFC',
  inset: '#EEF1F4',
  nav: '#122E51',
  disabled: '#E3E7EB',
};
// Subtle borders outline cards and divide sections within them; strong borders mark structure
// (nested-row rules, a second row group), so they stay a step darker than subtle. Warning is at
// least 3:1 (WCAG 1.4.11) on white and the canvas, unlike yellow.6.
const BORDER = {
  subtle: DEFAULT_THEME.colors.gray[4],
  strong: DEFAULT_THEME.colors.gray[5],
  warning: '#C77700',
};
// Mantine's shade-9 green and yellow text are under 4.5:1 on their light backgrounds.
const STATUS_TEXT = {
  green: '#196F45',
  yellow: '#9A5500',
};

// POC palette. Swap for the product design system's tokens at implementation time.
export const theme = createTheme({
  fontFamily: "'Source Sans 3', 'Source Sans Pro', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace",
  headings: {
    fontFamily: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif",
    fontWeight: '600',
  },
  primaryColor: 'brand',
  primaryShade: 6,
  colors: {
    brand: [
      '#E8F3FB',
      '#C1DDF0',
      '#9BC8E6',
      '#74B2DB',
      '#4D9CD0',
      '#2787C6',
      '#0071BB', // primary
      '#005A96', // hover
      '#004574',
      '#003559',
    ],
  },
  defaultRadius: 'sm',
  // Keyboard access for every overlay (Section 508): Escape closes it, focus stays inside while
  // it's open, and focus returns to whatever opened it. These match Mantine's defaults; they're
  // set here so the requirement is explicit and no modal or menu can drift from it.
  components: {
    // Field hints use the app's 14px detail size, not Mantine's 12px default.
    InputWrapper: { styles: { description: { fontSize: 'var(--mantine-font-size-sm)' } } },
    Modal: {
      defaultProps: {
        closeOnEscape: true,
        trapFocus: true,
        returnFocus: true,
        // Scroll inside Mantine's scroll area: a native scrollbar runs the full height of the
        // modal's edge and squares off its rounded corners where scrollbars are always shown.
        scrollAreaComponent: ScrollArea.Autosize,
      },
    },
    Menu: { defaultProps: { closeOnEscape: true, returnFocus: true } },
    Popover: { defaultProps: { closeOnEscape: true, returnFocus: true } },
    // Every Paper and Card is a white bordered card with the app's radius, so a plain <Paper>
    // looks right with no props.
    Paper: { defaultProps: { withBorder: true, radius: 'sm' } },
    Card: { defaultProps: { withBorder: true, radius: 'sm' } },
  },
});

// primaryShade applies to every color. Every non-primary color (red, blue, yellow, …) is
// pinned to shade 9 for its filled, light and outline variants so its text keeps AA
// contrast. color="blue" therefore renders darker than Mantine's docs show.
// The primary color uses its lightest tints for light backgrounds and their hover.
export const cssVariablesResolver: CSSVariablesResolver = (t) => {
  const light: Record<string, string> = {
    '--mantine-color-brand-light': t.colors.brand[0],
    '--mantine-color-brand-light-hover': t.colors.brand[1],
    '--mantine-color-dimmed': TEXT.secondary,
    '--mantine-color-placeholder': TEXT.secondary,
    '--text-disabled': TEXT.disabled,
    '--text-nav': TEXT.nav,
    '--surface-canvas': SURFACE.canvas,
    '--surface-inset': SURFACE.inset,
    '--surface-nav': SURFACE.nav,
    '--surface-disabled': SURFACE.disabled,
    '--border-subtle': BORDER.subtle,
    '--border-strong': BORDER.strong,
    '--border-warning': BORDER.warning,
  };
  Object.keys(DEFAULT_THEME.colors).forEach((name) => {
    const nine = t.colors[name][9];
    Object.assign(light, {
      [`--mantine-color-${name}-filled`]: `var(--mantine-color-${name}-9)`,
      [`--mantine-color-${name}-filled-hover`]: `var(--mantine-color-${name}-8)`,
      [`--mantine-color-${name}-light`]: alpha(nine, 0.1),
      [`--mantine-color-${name}-light-hover`]: alpha(nine, 0.12),
      [`--mantine-color-${name}-light-color`]: `var(--mantine-color-${name}-9)`,
      [`--mantine-color-${name}-outline`]: `var(--mantine-color-${name}-9)`,
      [`--mantine-color-${name}-outline-hover`]: alpha(nine, 0.05),
    });
  });
  Object.entries(STATUS_TEXT).forEach(([name, color]) => {
    light[`--mantine-color-${name}-light-color`] = color;
  });
  // Light only: the app has no dark mode (main.tsx forces the light scheme).
  return { variables: {}, light, dark: {} };
};

// Status display metadata shared across the history table, modal, and confirmation.
export const STATUS_META: Record<Status, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'gray' },
  submitted: { label: 'Submitted to OCFO', color: 'blue' },
  review: { label: 'Under OCFO Review', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  returned: { label: 'Returned for Correction', color: 'red' },
};
