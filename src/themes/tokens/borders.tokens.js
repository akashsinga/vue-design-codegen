/**
 * Border Radius and Border Design Tokens
 * Defines border radius scale, border widths, and border styles
 */

// Border radius scale
export const borderRadius = {
    none: '0px',
    xs: '0.125rem',    // 2px
    sm: '0.25rem',     // 4px
    base: '0.375rem',  // 6px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px
    '2xl': '1.5rem',   // 24px
    '3xl': '2rem',     // 32px
    full: '9999px'     // Perfect circle/pill shape
}

// Component-specific border radius
export const componentBorderRadius = {
    // Button border radius
    button: {
        small: borderRadius.sm,
        medium: borderRadius.base,
        large: borderRadius.md,
        fab: borderRadius.full,
        'extended-fab': borderRadius.lg
    },

    // Input field border radius
    input: {
        small: borderRadius.sm,
        medium: borderRadius.base,
        large: borderRadius.md,
        filled: `${borderRadius.base} ${borderRadius.base} 0 0`, // Top corners only
        outlined: borderRadius.base
    },

    // Card border radius
    card: {
        small: borderRadius.md,
        medium: borderRadius.lg,
        large: borderRadius.xl
    },

    // Dialog border radius
    dialog: {
        small: borderRadius.lg,
        medium: borderRadius.xl,
        large: borderRadius['2xl'],
        'bottom-sheet': `${borderRadius.xl} ${borderRadius.xl} 0 0`, // Top corners only
        'side-sheet': borderRadius.none
    },

    // Navigation border radius
    navigation: {
        'nav-rail': borderRadius.full,
        'nav-drawer': borderRadius.lg,
        'bottom-nav': borderRadius.none,
        'app-bar': borderRadius.none,
        'tab': borderRadius.base
    },

    // Chip border radius
    chip: {
        default: borderRadius.md,
        small: borderRadius.sm,
        filter: borderRadius.md,
        input: borderRadius.md
    },

    // Avatar border radius
    avatar: {
        square: borderRadius.base,
        rounded: borderRadius.lg,
        circular: borderRadius.full
    },

    // Badge border radius
    badge: {
        default: borderRadius.full,
        dot: borderRadius.full,
        rectangular: borderRadius.sm
    }
}

// Border width scale
export const borderWidth = {
    0: '0px',
    px: '1px',
    0.5: '0.5px',
    1: '1px',
    1.5: '1.5px',
    2: '2px',
    3: '3px',
    4: '4px',
    6: '6px',
    8: '8px'
}

// Border styles
export const borderStyle = {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    groove: 'groove',
    ridge: 'ridge',
    inset: 'inset',
    outset: 'outset',
    none: 'none',
    hidden: 'hidden'
}

// Component border configurations
export const componentBorders = {
    // Input borders
    input: {
        default: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        focused: {
            width: borderWidth[2],
            style: borderStyle.solid
        },
        error: {
            width: borderWidth[2],
            style: borderStyle.solid
        },
        disabled: {
            width: borderWidth[1],
            style: borderStyle.dashed
        }
    },

    // Button borders
    button: {
        outlined: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        'outlined-focused': {
            width: borderWidth[2],
            style: borderStyle.solid
        }
    },

    // Card borders
    card: {
        outlined: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        elevated: {
            width: borderWidth[0],
            style: borderStyle.none
        }
    },

    // Dialog borders
    dialog: {
        default: {
            width: borderWidth[0],
            style: borderStyle.none
        },
        outlined: {
            width: borderWidth[1],
            style: borderStyle.solid
        }
    },

    // Table borders
    table: {
        cell: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        header: {
            width: borderWidth[2],
            style: borderStyle.solid
        },
        divider: {
            width: borderWidth[1],
            style: borderStyle.solid
        }
    },

    // Divider borders
    divider: {
        horizontal: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        vertical: {
            width: borderWidth[1],
            style: borderStyle.solid
        },
        thick: {
            width: borderWidth[2],
            style: borderStyle.solid
        }
    }
}

// Outline configurations (for focus states)
export const outlines = {
    // Standard outlines
    none: 'none',
    default: {
        width: borderWidth[2],
        style: 'solid',
        offset: '2px'
    },
    thick: {
        width: borderWidth[3],
        style: 'solid',
        offset: '2px'
    },
    dashed: {
        width: borderWidth[2],
        style: 'dashed',
        offset: '2px'
    },
    dotted: {
        width: borderWidth[2],
        style: 'dotted',
        offset: '2px'
    }
}

// Border animations and transitions
export const borderTransitions = {
    default: 'border-color 0.15s ease-out, border-width 0.15s ease-out',
    fast: 'border-color 0.1s ease-out, border-width 0.1s ease-out',
    slow: 'border-color 0.3s ease-out, border-width 0.3s ease-out',
    'ease-in-out': 'border-color 0.2s ease-in-out, border-width 0.2s ease-in-out'
}

// Shape definitions (combining border radius with other properties)
export const shapes = {
    // Rectangular shapes
    rectangle: {
        borderRadius: borderRadius.none
    },
    'rounded-rectangle': {
        borderRadius: borderRadius.base
    },
    'extra-rounded-rectangle': {
        borderRadius: borderRadius.lg
    },

    // Circular shapes
    circle: {
        borderRadius: borderRadius.full,
        aspectRatio: '1'
    },

    // Pill shapes
    pill: {
        borderRadius: borderRadius.full
    },

    // Cut corner shapes
    'cut-corner': {
        borderRadius: borderRadius.none,
        clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)'
    }
}

// Complete borders export
export const borderTokens = { borderRadius, componentBorderRadius, borderWidth, borderStyle, componentBorders, outlines, borderTransitions, shapes }