/**
 * Spacing and Layout Design Tokens
 * Defines consistent spacing scale, component dimensions, and layout values.
 */

export const spacing = {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem'       // 384px
}

export const componentSpacing = {
    // Button padding
    button: {
        'padding-x-small': spacing[2],
        'padding-y-small': spacing[1],
        'padding-x-medium': spacing[4],
        'padding-y-medium': spacing[2],
        'padding-x-large': spacing[6],
        'padding-y-large': spacing[3]
    },

    // Input field dimensions
    input: {
        'padding-x': spacing[3],
        'padding-y': spacing[2],
        'height-small': spacing[8],
        'height-medium': spacing[10],
        'height-large': spacing[12]
    },

    // Card spacing
    card: {
        'padding-small': spacing[4],
        'padding-medium': spacing[6],
        'padding-large': spacing[8],
        'gap': spacing[4]
    },

    // List item spacing
    list: {
        'item-padding-x': spacing[4],
        'item-padding-y': spacing[3],
        'item-gap': spacing[2]
    },

    // Navigation spacing
    navigation: {
        'item-padding-x': spacing[4],
        'item-padding-y': spacing[2],
        'section-gap': spacing[6]
    }
}

// Layout dimensions
export const dimensions = {
    container: {
        'xs': '20rem',      // 320px
        'sm': '24rem',      // 384px
        'md': '28rem',      // 448px
        'lg': '32rem',      // 512px
        'xl': '36rem',      // 576px
        '2xl': '42rem',     // 672px
        '3xl': '48rem',     // 768px
        '4xl': '56rem',     // 896px
        '5xl': '64rem',     // 1024px
        '6xl': '72rem',     // 1152px
        '7xl': '80rem',     // 1280px
        'full': '100%'
    },

    width: {
        'auto': 'auto',
        'full': '100%',
        'screen': '100vw',
        'min': 'min-content',
        'max': 'max-content',
        'fit': 'fit-content'
    },

    height: {
        'auto': 'auto',
        'full': '100%',
        'screen': '100vh',
        'min': 'min-content',
        'max': 'max-content',
        'fit': 'fit-content'
    },

    zIndex: {
        'auto': 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080'
    }
}

export const breakpoints = {
    xs: '0px',
    sm: '600px',     // Small devices (phones)
    md: '960px',     // Medium devices (tablets)
    lg: '1264px',    // Large devices (desktops)
    xl: '1904px'     // Extra large devices (large desktops)
}

// Grid system
export const grid = {
    columns: 12,
    gutter: {
        xs: spacing[4],  // 16px
        sm: spacing[6],  // 24px
        md: spacing[8],  // 32px
        lg: spacing[10], // 40px
        xl: spacing[12]  // 48px
    },
    margins: {
        xs: spacing[4],  // 16px
        sm: spacing[6],  // 24px
        md: spacing[8],  // 32px
        lg: spacing[12], // 48px
        xl: spacing[16]  // 64px
    }
}

// Layout utilities
export const layout = {
    // Content spacing
    content: {
        'section-gap': spacing[16],     // Between major sections
        'subsection-gap': spacing[12],  // Between subsections
        'element-gap': spacing[6],      // Between related elements
        'tight-gap': spacing[4]         // Between tightly related elements
    },

    // Form spacing
    form: {
        'field-gap': spacing[6],        // Between form fields
        'group-gap': spacing[8],        // Between form groups
        'action-gap': spacing[4]        // Between form actions
    },

    // Page layout
    page: {
        'header-height': spacing[16],   // Standard header height
        'footer-height': spacing[12],   // Standard footer height
        'sidebar-width': spacing[64],   // Standard sidebar width
        'content-padding': spacing[8]   // Standard content padding
    }
}

// Complete spacing export
export const spacingTokens = { spacing, componentSpacing, dimensions, breakpoints, grid, layout }