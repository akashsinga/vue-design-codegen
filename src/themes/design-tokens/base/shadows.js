/**
 * Shadows and Elevation Design Tokens
 * Defines shadow system for depth, elevation, and focus states
 */

// Base shadow definitions (Material Design 3 inspired)
export const shadows = {
    // No shadow
    none: 'none',

    // Subtle shadows for minimal elevation
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

    // Standard shadows for common elevation levels
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',

    // Strong shadows for high elevation
    '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
    '3xl': '0 35px 60px -12px rgb(0 0 0 / 0.35)'
}

// Material Design 3 elevation levels (0-5 for most UI components)
export const elevation = {
    0: shadows.none,
    1: '0 1px 3px 1px rgb(0 0 0 / 0.15), 0 1px 2px 0 rgb(0 0 0 / 0.3)',
    2: '0 2px 6px 2px rgb(0 0 0 / 0.15), 0 1px 2px 0 rgb(0 0 0 / 0.3)',
    3: '0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.3)',
    4: '0 6px 10px 4px rgb(0 0 0 / 0.15), 0 2px 3px 0 rgb(0 0 0 / 0.3)',
    5: '0 8px 12px 6px rgb(0 0 0 / 0.15), 0 4px 4px 0 rgb(0 0 0 / 0.3)'
}

// Component-specific shadow mappings
export const componentShadows = {
    // Button shadows
    button: {
        elevated: elevation[1],
        'elevated-hover': elevation[2],
        'elevated-pressed': elevation[1],
        fab: elevation[3],
        'fab-hover': elevation[4],
        'fab-pressed': elevation[3]
    },

    // Card shadows
    card: {
        elevated: elevation[1],
        filled: shadows.none,
        outlined: shadows.none
    },

    // Navigation shadows
    navigation: {
        'app-bar': elevation[2],
        'nav-drawer': elevation[1],
        'bottom-nav': elevation[3],
        tabs: elevation[2]
    },

    // Dialog and overlay shadows
    dialog: {
        modal: elevation[5],
        'bottom-sheet': elevation[4],
        'side-sheet': elevation[1]
    },

    // Menu and dropdown shadows
    menu: {
        dropdown: elevation[3],
        'context-menu': elevation[2],
        tooltip: elevation[2]
    },

    // Form component shadows
    form: {
        'input-focus': shadows.none,
        'select-dropdown': elevation[2],
        'date-picker': elevation[3]
    },

    // Data display shadows
    table: {
        elevated: elevation[1],
        sticky: elevation[2]
    }
}

// Focus ring definitions
export const focusRings = {
    // Standard focus rings
    default: '0 0 0 2px rgb(59 130 246 / 0.5)',
    primary: '0 0 0 2px rgb(59 130 246 / 0.5)',
    secondary: '0 0 0 2px rgb(168 85 247 / 0.5)',
    success: '0 0 0 2px rgb(16 185 129 / 0.5)',
    warning: '0 0 0 2px rgb(245 158 11 / 0.5)',
    error: '0 0 0 2px rgb(239 68 68 / 0.5)',
    info: '0 0 0 2px rgb(14 165 233 / 0.5)',

    // Accessible high contrast focus rings
    'high-contrast': '0 0 0 3px rgb(0 0 0), 0 0 0 6px rgb(255 255 255)',

    // Inset focus rings (for dark backgrounds)
    inset: 'inset 0 0 0 2px rgb(59 130 246)',

    // Focus rings with offsets
    offset: '0 0 0 2px rgb(255 255 255), 0 0 0 4px rgb(59 130 246 / 0.5)'
}

// Inner shadows (for pressed states, inset elements)
export const innerShadows = {
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
    md: 'inset 0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: 'inset 0 10px 15px -3px rgb(0 0 0 / 0.1)'
}

// Colored shadows (for brand elements)
export const coloredShadows = {
    primary: {
        sm: '0 1px 3px 0 rgb(59 130 246 / 0.12), 0 1px 2px 0 rgb(59 130 246 / 0.24)',
        base: '0 4px 6px -1px rgb(59 130 246 / 0.12), 0 2px 4px -1px rgb(59 130 246 / 0.24)',
        lg: '0 20px 25px -5px rgb(59 130 246 / 0.12), 0 10px 10px -5px rgb(59 130 246 / 0.24)'
    },
    secondary: {
        sm: '0 1px 3px 0 rgb(168 85 247 / 0.12), 0 1px 2px 0 rgb(168 85 247 / 0.24)',
        base: '0 4px 6px -1px rgb(168 85 247 / 0.12), 0 2px 4px -1px rgb(168 85 247 / 0.24)',
        lg: '0 20px 25px -5px rgb(168 85 247 / 0.12), 0 10px 10px -5px rgb(168 85 247 / 0.24)'
    },
    success: {
        sm: '0 1px 3px 0 rgb(16 185 129 / 0.12), 0 1px 2px 0 rgb(16 185 129 / 0.24)',
        base: '0 4px 6px -1px rgb(16 185 129 / 0.12), 0 2px 4px -1px rgb(16 185 129 / 0.24)',
        lg: '0 20px 25px -5px rgb(16 185 129 / 0.12), 0 10px 10px -5px rgb(16 185 129 / 0.24)'
    },
    error: {
        sm: '0 1px 3px 0 rgb(239 68 68 / 0.12), 0 1px 2px 0 rgb(239 68 68 / 0.24)',
        base: '0 4px 6px -1px rgb(239 68 68 / 0.12), 0 2px 4px -1px rgb(239 68 68 / 0.24)',
        lg: '0 20px 25px -5px rgb(239 68 68 / 0.12), 0 10px 10px -5px rgb(239 68 68 / 0.24)'
    }
}

// Animation-ready shadow transitions
export const shadowTransitions = {
    default: 'box-shadow 0.15s ease-out',
    fast: 'box-shadow 0.1s ease-out',
    slow: 'box-shadow 0.3s ease-out',
    'ease-in-out': 'box-shadow 0.2s ease-in-out'
}

// Complete shadows export
export const shadowTokens = { shadows, elevation, componentShadows, focusRings, innerShadows, coloredShadows, shadowTransitions }