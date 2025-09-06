/**
 * Dark Theme Semantic Mappings
 * Maps base design tokens to semantic roles for dark theme
 * Follows Material Design 3 dark theme principles with proper contrast and accessibility
 */

import { colors } from './tokens/colors.tokens.js'
import { typography } from './tokens/typography.tokens.js'
import { spacingTokens } from './tokens/spacing.tokens.js'
import { shadowTokens } from './tokens/shadows.tokens.js'
import { borderTokens } from './tokens/borders.tokens.js'
import { motionTokens } from './tokens/motion.tokens.js'

export const darkTheme = {
    // Theme metadata
    name: 'dark',
    displayName: 'Dark Theme',
    type: 'dark',

    // Color semantic mappings (inverted and adjusted for dark theme)
    colors: {
        // Primary brand colors (lighter variants for dark theme)
        primary: colors.primary[300],
        'on-primary': colors.primary[900],
        'primary-container': colors.primary[800],
        'on-primary-container': colors.primary[100],
        'primary-fixed': colors.primary[400],
        'on-primary-fixed': colors.primary[900],
        'primary-fixed-dim': colors.primary[300],
        'on-primary-fixed-variant': colors.primary[800],

        // Secondary colors (adjusted for dark theme)
        secondary: colors.secondary[300],
        'on-secondary': colors.secondary[900],
        'secondary-container': colors.secondary[800],
        'on-secondary-container': colors.secondary[100],
        'secondary-fixed': colors.secondary[400],
        'on-secondary-fixed': colors.secondary[900],
        'secondary-fixed-dim': colors.secondary[300],
        'on-secondary-fixed-variant': colors.secondary[800],

        // Tertiary colors
        tertiary: colors.info[300],
        'on-tertiary': colors.info[900],
        'tertiary-container': colors.info[800],
        'on-tertiary-container': colors.info[100],
        'tertiary-fixed': colors.info[400],
        'on-tertiary-fixed': colors.info[900],
        'tertiary-fixed-dim': colors.info[300],
        'on-tertiary-fixed-variant': colors.info[800],

        // Error colors (slightly adjusted for dark theme)
        error: colors.error[300],
        'on-error': colors.error[900],
        'error-container': colors.error[800],
        'on-error-container': colors.error[100],

        // Warning colors
        warning: colors.warning[300],
        'on-warning': colors.warning[900],
        'warning-container': colors.warning[800],
        'on-warning-container': colors.warning[100],

        // Success colors
        success: colors.success[300],
        'on-success': colors.success[900],
        'success-container': colors.success[800],
        'on-success-container': colors.success[100],

        // Info colors
        info: colors.info[300],
        'on-info': colors.info[900],
        'info-container': colors.info[800],
        'on-info-container': colors.info[100],

        // Surface colors (dark backgrounds and containers)
        surface: colors.neutral[900],
        'on-surface': colors.neutral[100],
        'surface-variant': colors.neutral[800],
        'on-surface-variant': colors.neutral[400],
        'surface-dim': colors.neutral[950],
        'surface-bright': colors.neutral[800],

        // Surface container variations (progressively lighter in dark theme)
        'surface-container-lowest': colors.neutral[950],
        'surface-container-low': colors.neutral[900],
        'surface-container': colors.neutral[800],
        'surface-container-high': colors.neutral[700],
        'surface-container-highest': colors.neutral[600],

        // Background colors
        background: colors.neutral[950],
        'on-background': colors.neutral[100],

        // Outline colors (borders and dividers for dark theme)
        outline: colors.neutral[600],
        'outline-variant': colors.neutral[700],

        // Shadow and scrim colors (darker in dark theme)
        shadow: colors.neutral[950],
        scrim: colors.neutral[950],

        // Inverse colors (for light elements on dark theme)
        'inverse-surface': colors.neutral[100],
        'on-inverse-surface': colors.neutral[800],
        'inverse-primary': colors.primary[700],
        'inverse-on-primary': colors.primary[100],

        // Text color variations (light colors for dark backgrounds)
        'text-primary': colors.neutral[100],
        'text-secondary': colors.neutral[400],
        'text-tertiary': colors.neutral[500],
        'text-disabled': colors.neutral[600],

        // Icon color variations
        'icon-primary': colors.neutral[100],
        'icon-secondary': colors.neutral[400],
        'icon-tertiary': colors.neutral[500],
        'icon-disabled': colors.neutral[600],

        // State layer colors (for hover, focus, pressed states on dark theme)
        'state-hover': `${colors.neutral[100]}`,
        'state-focus': `${colors.neutral[100]}`,
        'state-pressed': `${colors.neutral[100]}`,
        'state-dragged': `${colors.neutral[100]}`,

        // Brand state layers (adjusted for dark theme)
        'primary-state-hover': `${colors.primary[300]}`,
        'primary-state-focus': `${colors.primary[300]}`,
        'primary-state-pressed': `${colors.primary[300]}`,

        // Utility colors
        // transparent: 'transparent',
        // 'current-color': 'currentColor'
    },

    // Typography semantic mappings (same structure as light theme)
    typography: {
        // Font families
        'font-family-sans': typography.fontFamilies.sans.join(', '),
        'font-family-serif': typography.fontFamilies.serif.join(', '),
        'font-family-mono': typography.fontFamilies.mono.join(', '),

        // Typography scale mappings (unchanged from light theme)
        'display-large': typography.typographyScale['display-large'],
        'display-medium': typography.typographyScale['display-medium'],
        'display-small': typography.typographyScale['display-small'],
        'headline-large': typography.typographyScale['headline-large'],
        'headline-medium': typography.typographyScale['headline-medium'],
        'headline-small': typography.typographyScale['headline-small'],
        'title-large': typography.typographyScale['title-large'],
        'title-medium': typography.typographyScale['title-medium'],
        'title-small': typography.typographyScale['title-small'],
        'label-large': typography.typographyScale['label-large'],
        'label-medium': typography.typographyScale['label-medium'],
        'label-small': typography.typographyScale['label-small'],
        'body-large': typography.typographyScale['body-large'],
        'body-medium': typography.typographyScale['body-medium'],
        'body-small': typography.typographyScale['body-small']
    },

    // Spacing semantic mappings (identical to light theme)
    spacing: {
        // Use spacing scale directly
        ...spacingTokens.spacing,

        // Component-specific spacing
        'component-padding': spacingTokens.componentSpacing,
        'layout-spacing': spacingTokens.layout,

        // Responsive grid
        'grid-margins': spacingTokens.grid.margins,
        'grid-gutters': spacingTokens.grid.gutter
    },

    // Shadow semantic mappings (enhanced for dark theme visibility)
    shadows: {
        // Standard elevation (stronger shadows for dark theme)
        'elevation-0': shadowTokens.elevation[0],
        'elevation-1': '0 2px 4px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'elevation-2': '0 3px 8px 0 rgb(0 0 0 / 0.3), 0 2px 4px 0 rgb(0 0 0 / 0.4)',
        'elevation-3': '0 6px 12px 0 rgb(0 0 0 / 0.3), 0 4px 8px 0 rgb(0 0 0 / 0.4)',
        'elevation-4': '0 8px 16px 0 rgb(0 0 0 / 0.3), 0 6px 12px 0 rgb(0 0 0 / 0.4)',
        'elevation-5': '0 12px 24px 0 rgb(0 0 0 / 0.3), 0 8px 16px 0 rgb(0 0 0 / 0.4)',

        // Component shadows (adjusted for dark theme)
        'button-elevated': '0 2px 4px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'button-elevated-hover': '0 3px 8px 0 rgb(0 0 0 / 0.3), 0 2px 4px 0 rgb(0 0 0 / 0.4)',
        'card-elevated': '0 2px 4px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'dialog-modal': '0 12px 24px 0 rgb(0 0 0 / 0.3), 0 8px 16px 0 rgb(0 0 0 / 0.4)',
        'menu-dropdown': '0 6px 12px 0 rgb(0 0 0 / 0.3), 0 4px 8px 0 rgb(0 0 0 / 0.4)',

        // Focus rings (adjusted for dark theme visibility)
        'focus-ring': `0 0 0 2px ${colors.primary[300]}`,
        'focus-ring-primary': `0 0 0 2px ${colors.primary[300]}`,
        'focus-ring-error': `0 0 0 2px ${colors.error[300]}`
    },

    // Border semantic mappings (adjusted border colors for dark theme)
    borders: {
        // Border radius (same as light theme)
        'border-radius-xs': borderTokens.borderRadius.xs,
        'border-radius-sm': borderTokens.borderRadius.sm,
        'border-radius-base': borderTokens.borderRadius.base,
        'border-radius-md': borderTokens.borderRadius.md,
        'border-radius-lg': borderTokens.borderRadius.lg,
        'border-radius-xl': borderTokens.borderRadius.xl,
        'border-radius-full': borderTokens.borderRadius.full,

        // Component borders (adjusted for dark theme)
        'input-border': {
            width: borderTokens.componentBorders.input.default.width,
            style: borderTokens.componentBorders.input.default.style,
            color: colors.neutral[600]
        },
        'input-border-focused': {
            width: borderTokens.componentBorders.input.focused.width,
            style: borderTokens.componentBorders.input.focused.style,
            color: colors.primary[300]
        },
        'input-border-error': {
            width: borderTokens.componentBorders.input.error.width,
            style: borderTokens.componentBorders.input.error.style,
            color: colors.error[300]
        },

        // Divider borders (lighter for visibility on dark backgrounds)
        'divider-color': colors.neutral[700],
        'divider-strong-color': colors.neutral[600]
    },

    // Motion semantic mappings (identical to light theme)
    motion: {
        // Duration presets
        'duration-instant': motionTokens.duration.instant,
        'duration-fast': motionTokens.duration.fast,
        'duration-standard': motionTokens.duration.standard,
        'duration-slow': motionTokens.duration.slow,

        // Easing presets
        'easing-standard': motionTokens.easing.standard,
        'easing-emphasized': motionTokens.easing.emphasized,
        'easing-emphasized-decelerate': motionTokens.easing['emphasized-decelerate'],
        'easing-emphasized-accelerate': motionTokens.easing['emphasized-accelerate'],

        // Component motion
        'button-press': motionTokens.componentMotion.button.press,
        'input-focus': motionTokens.componentMotion.input.focus,
        'dialog-enter': motionTokens.componentMotion.dialog.enter,
        'dialog-exit': motionTokens.componentMotion.dialog.exit
    },

    // Component-specific overrides for dark theme
    components: {
        // Button variants (adjusted for dark theme)
        button: {
            elevated: {
                backgroundColor: colors.primary[300],
                color: colors.primary[900],
                shadow: '0 2px 4px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.4)'
            },
            filled: {
                backgroundColor: colors.primary[300],
                color: colors.primary[900]
            },
            'filled-tonal': {
                backgroundColor: colors.primary[800],
                color: colors.primary[100]
            },
            outlined: {
                // backgroundColor: 'transparent',
                color: colors.primary[300],
                borderColor: colors.primary[300]
            },
            text: {
                // backgroundColor: 'transparent',
                color: colors.primary[300]
            }
        }
    }
}