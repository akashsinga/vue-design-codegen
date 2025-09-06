/**
 * Typography Design Tokens - Universal Font System
 * Defines font families, sizes, weights, and line heights for all themes.
 */

export const fontFamilies = {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont'],
    serif: ['Georgia', 'Cambria'],
    mono: ['"JetBrains Mono"', 'Menlo']
}

export const fontWeights = {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
}

export const fontSizes = {
    'xs': '0.75rem',    // 12px
    'sm': '0.875rem',   // 14px
    'base': '1rem',     // 16px
    'lg': '1.125rem',   // 18px
    'xl': '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem'      // 128px
}

export const lineHeights = {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
}

export const letterSpacing = {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
}

export const typographyScale = {
    // Display Styles (Large)
    'display-large': {
        fontSize: fontSizes['6xl'],
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacing.tight
    },
    'display-medium': {
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacing.normal
    },
    'display-small': {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacing.normal
    },

    // Headline styles
    'headline-large': {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.normal
    },
    'headline-medium': {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.normal
    },
    'headline-small': {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.normal
    },

    // Title styles
    'title-large': {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacing.normal
    },
    'title-medium': {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacing.wide
    },
    'title-small': {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacing.wide
    },

    // Label styles (for buttons, form labels, etc.)
    'label-large': {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.wide
    },
    'label-medium': {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.wider
    },
    'label-small': {
        fontSize: '0.6875rem', // 11px
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.widest
    },

    // Body text styles
    'body-large': {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.relaxed,
        letterSpacing: letterSpacing.normal
    },
    'body-medium': {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacing.normal
    },
    'body-small': {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacing.normal
    }
}

export const typography = { fontFamilies, fontWeights, fontSizes, lineHeights, letterSpacing, typographyScale }