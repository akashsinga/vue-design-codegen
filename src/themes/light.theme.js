/**
 * Light Theme Semantic Mappings
 * Maps base design tokens to semantic roles for light theme
 * This creates the universal theme structure that adapters will transform
 */

import { colors } from '../base/colors.js'
import { typography } from '../base/typography.js'
import { spacingTokens } from '../base/spacing.js'
import { shadowTokens } from '../base/shadows.js'
import { borderTokens } from '../base/borders.js'
import { motionTokens } from '../base/motion.js'

export const lightTheme = {
    name: 'light',
    displayName: 'Light Theme',
    type: 'light',
    colors: {
        // Primary brand colors
        primary: colors.primary[500],
        'on-primary': colors.neutral[0],
        'primary-container': colors.primary[100],
        'on-primary-container': colors.primary[900],
        'primary-fixed': colors.primary[600],
        'on-primary-fixed': colors.neutral[0],
        'primary-fixed-dim': colors.primary[700],
        'on-primary-fixed-variant': colors.primary[100],

        // Secondary Colors
        secondary: colors.secondary[500],
        'on-secondary': colors.neutral[0],
        'secondary-container': colors.secondary[100],
        'on-secondary-container': colors.secondary[900],
        'secondary-fixed': colors.secondary[600],
        'on-secondary-fixed': colors.neutral[0],
        'secondary-fixed-dim': colors.secondary[700],
        'on-secondary-fixed-variant': colors.secondary[100],

        // Tertiary colors
        tertiary: colors.info[500],
        'on-tertiary': colors.neutral[0],
        'tertiary-container': colors.info[100],
        'on-tertiary-container': colors.info[900],
        'tertiary-fixed': colors.info[600],
        'on-tertiary-fixed': colors.neutral[0],
        'tertiary-fixed-dim': colors.info[700],
        'on-tertiary-fixed-variant': colors.info[100],

        // Error colors
        error: colors.error[500],
        'on-error': colors.neutral[0],
        'error-container': colors.error[100],
        'on-error-container': colors.error[900],

        // Warning colors
        warning: colors.warning[500],
        'on-warning': colors.neutral[900],
        'warning-container': colors.warning[100],
        'on-warning-container': colors.warning[900],

        // Success colors
        success: colors.success[500],
        'on-success': colors.neutral[0],
        'success-container': colors.success[100],
        'on-success-container': colors.success[900],

        // Info colors
        info: colors.info[500],
        'on-info': colors.neutral[0],
        'info-container': colors.info[100],
        'on-info-container': colors.info[900],

        // Surface colors (backgrounds and containers)
        surface: colors.neutral[50],
        'on-surface': colors.neutral[900],
        'surface-variant': colors.neutral[100],
        'on-surface-variant': colors.neutral[600],
        'surface-dim': colors.neutral[100],
        'surface-bright': colors.neutral[0],

        // Surface container variations
        'surface-container-lowest': colors.neutral[0],
        'surface-container-low': colors.neutral[50],
        'surface-container': colors.neutral[100],
        'surface-container-high': colors.neutral[200],
        'surface-container-highest': colors.neutral[300],

        // Background colors
        background: colors.neutral[0],
        'on-background': colors.neutral[900],

        // Outline colors (borders and dividers)
        outline: colors.neutral[300],
        'outline-variant': colors.neutral[200],

        // Shadow and scrim colors
        shadow: colors.neutral[900],
        scrim: colors.neutral[900],

        // Inverse colors (for dark elements on light theme)
        'inverse-surface': colors.neutral[800],
        'on-inverse-surface': colors.neutral[100],
        'inverse-primary': colors.primary[200],
        'inverse-on-primary': colors.primary[800],

        // Text color variations
        'text-primary': colors.neutral[900],
        'text-secondary': colors.neutral[600],
        'text-tertiary': colors.neutral[500],
        'text-disabled': colors.neutral[400],

        // Icon color variations
        'icon-primary': colors.neutral[900],
        'icon-secondary': colors.neutral[600],
        'icon-tertiary': colors.neutral[500],
        'icon-disabled': colors.neutral[400],

        // State layer colors (for hover, focus, pressed states)
        'state-hover': `${colors.neutral[900]} / 0.08`,
        'state-focus': `${colors.neutral[900]} / 0.12`,
        'state-pressed': `${colors.neutral[900]} / 0.16`,
        'state-dragged': `${colors.neutral[900]} / 0.16`,

        // Brand state layers
        'primary-state-hover': `${colors.primary[500]} / 0.08`,
        'primary-state-focus': `${colors.primary[500]} / 0.12`,
        'primary-state-pressed': `${colors.primary[500]} / 0.16`,

        // Utility colors
        transparent: 'transparent',
        'current-color': 'currentColor'
    },
    // Typography semantic mappings
    typography: {
        // Font families
        'font-family-sans': typography.fontFamilies.sans.join(', '),
        'font-family-serif': typography.fontFamilies.serif.join(', '),
        'font-family-mono': typography.fontFamilies.mono.join(', '),

        // Typography scale mappings
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

    // Spacing semantic mappings
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

    // Shadow semantic mappings
    shadows: {
        // Standard elevation
        'elevation-0': shadowTokens.elevation[0],
        'elevation-1': shadowTokens.elevation[1],
        'elevation-2': shadowTokens.elevation[2],
        'elevation-3': shadowTokens.elevation[3],
        'elevation-4': shadowTokens.elevation[4],
        'elevation-5': shadowTokens.elevation[5],

        // Component shadows
        'button-elevated': shadowTokens.componentShadows.button.elevated,
        'button-elevated-hover': shadowTokens.componentShadows.button['elevated-hover'],
        'card-elevated': shadowTokens.componentShadows.card.elevated,
        'dialog-modal': shadowTokens.componentShadows.dialog.modal,
        'menu-dropdown': shadowTokens.componentShadows.menu.dropdown,

        // Focus rings
        'focus-ring': shadowTokens.focusRings.default,
        'focus-ring-primary': shadowTokens.focusRings.primary,
        'focus-ring-error': shadowTokens.focusRings.error
    },

    // Border semantic mappings
    borders: {
        // Border radius
        'border-radius-xs': borderTokens.borderRadius.xs,
        'border-radius-sm': borderTokens.borderRadius.sm,
        'border-radius-base': borderTokens.borderRadius.base,
        'border-radius-md': borderTokens.borderRadius.md,
        'border-radius-lg': borderTokens.borderRadius.lg,
        'border-radius-xl': borderTokens.borderRadius.xl,
        'border-radius-full': borderTokens.borderRadius.full,

        // Component borders
        'input-border': {
            width: borderTokens.componentBorders.input.default.width,
            style: borderTokens.componentBorders.input.default.style,
            color: colors.neutral[300]
        },
        'input-border-focused': {
            width: borderTokens.componentBorders.input.focused.width,
            style: borderTokens.componentBorders.input.focused.style,
            color: colors.primary[500]
        },
        'input-border-error': {
            width: borderTokens.componentBorders.input.error.width,
            style: borderTokens.componentBorders.input.error.style,
            color: colors.error[500]
        },

        // Divider borders
        'divider-color': colors.neutral[200],
        'divider-strong-color': colors.neutral[300]
    },

    // Motion semantic mappings
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

    // Component-specific overrides and variations
    components: {
        // Button variants
        button: {
            elevated: {
                backgroundColor: colors.primary[500],
                color: colors.neutral[0],
                shadow: shadowTokens.componentShadows.button.elevated
            },
            filled: {
                backgroundColor: colors.primary[500],
                color: colors.neutral[0]
            },
            'filled-tonal': {
                backgroundColor: colors.primary[100],
                color: colors.primary[900]
            },
            outlined: {
                backgroundColor: 'transparent',
                color: colors.primary[500],
                borderColor: colors.primary[500]
            },
            text: {
                backgroundColor: 'transparent',
                color: colors.primary[500]
            }
        }
    }
}