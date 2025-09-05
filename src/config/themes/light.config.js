/**
 * Light theme configuration with embedded validation
 * Demonstrates comprehensive theme token system
 */
export default {
    name: 'light',
    description: 'Clean and modern light theme',
    category: 'default',
    version: '1.0.0',
    author: 'Design System Team',

    // Base design tokens
    tokens: {
        colors: {
            // Primary palette
            primary: {
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#3b82f6',
                600: '#2563eb',
                700: '#1d4ed8',
                800: '#1e40af',
                900: '#1e3a8a'
            },

            // Secondary palette
            secondary: {
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a'
            },

            // Semantic colors
            success: {
                50: '#f0fdf4',
                100: '#dcfce7',
                200: '#bbf7d0',
                300: '#86efac',
                400: '#4ade80',
                500: '#22c55e',
                600: '#16a34a',
                700: '#15803d',
                800: '#166534',
                900: '#14532d'
            },

            warning: {
                50: '#fffbeb',
                100: '#fef3c7',
                200: '#fde68a',
                300: '#fcd34d',
                400: '#fbbf24',
                500: '#f59e0b',
                600: '#d97706',
                700: '#b45309',
                800: '#92400e',
                900: '#78350f'
            },

            error: {
                50: '#fef2f2',
                100: '#fee2e2',
                200: '#fecaca',
                300: '#fca5a5',
                400: '#f87171',
                500: '#ef4444',
                600: '#dc2626',
                700: '#b91c1c',
                800: '#991b1b',
                900: '#7f1d1d'
            },

            // Neutral colors
            white: '#ffffff',
            black: '#000000',
            transparent: 'transparent',

            // Surface colors
            surface: {
                base: '#ffffff',
                raised: '#ffffff',
                overlay: '#ffffff',
                sticky: 'rgba(255, 255, 255, 0.95)'
            },

            // Text colors
            text: {
                primary: '#1f2937',
                secondary: '#6b7280',
                tertiary: '#9ca3af',
                inverse: '#ffffff',
                disabled: '#d1d5db'
            },

            // Border colors
            border: {
                default: '#e5e7eb',
                muted: '#f3f4f6',
                strong: '#d1d5db',
                inverse: '#374151'
            }
        },

        typography: {
            fontFamilies: {
                sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            },

            fontWeights: {
                thin: '100',
                light: '300',
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
                black: '900'
            },

            lineHeights: {
                none: '1',
                tight: '1.25',
                snug: '1.375',
                normal: '1.5',
                relaxed: '1.625',
                loose: '2'
            },

            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0',
                wide: '0.025em',
                wider: '0.05em',
                widest: '0.1em'
            }
        },

        spacing: {
            0: '0px',
            1: '4px',
            2: '8px',
            3: '12px',
            4: '16px',
            5: '20px',
            6: '24px',
            7: '28px',
            8: '32px',
            9: '36px',
            10: '40px',
            11: '44px',
            12: '48px',
            14: '56px',
            16: '64px',
            20: '80px',
            24: '96px',
            28: '112px',
            32: '128px',
            36: '144px',
            40: '160px',
            44: '176px',
            48: '192px',
            52: '208px',
            56: '224px',
            60: '240px',
            64: '256px',
            72: '288px',
            80: '320px',
            96: '384px'
        },

        shadows: {
            none: 'none',
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
        },

        borderRadius: {
            none: '0px',
            sm: '2px',
            md: '4px',
            lg: '6px',
            xl: '8px',
            '2xl': '12px',
            '3xl': '16px',
            full: '9999px'
        },

        opacity: {
            0: '0',
            5: '0.05',
            10: '0.1',
            20: '0.2',
            25: '0.25',
            30: '0.3',
            40: '0.4',
            50: '0.5',
            60: '0.6',
            70: '0.7',
            75: '0.75',
            80: '0.8',
            90: '0.9',
            95: '0.95',
            100: '1'
        },

        zIndex: {
            auto: 'auto',
            0: '0',
            10: '10',
            20: '20',
            30: '30',
            40: '40',
            50: '50',
            dropdown: '1000',
            sticky: '1020',
            fixed: '1030',
            modal: '1040',
            popover: '1050',
            tooltip: '1060',
            maximum: '2147483647'
        }
    },

    // Computed tokens that depend on base tokens
    computed: {
        primaryWithOpacity: (tokens) => {
            const primary = tokens.get('colors').primary[500];
            return `color-mix(in srgb, ${primary} 80%, transparent)`;
        },

        surfaceElevated: (tokens) => {
            const surface = tokens.get('colors').surface.base;
            const shadow = tokens.get('shadows').md;
            return {
                backgroundColor: surface,
                boxShadow: shadow
            };
        }
    },

    // Breakpoints for responsive design
    breakpoints: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
    },

    // Component-specific token overrides
    componentTokens: {
        Button: {
            primaryBackground: '$colors.primary.500',
            primaryText: '$colors.white',
            primaryBorder: '$colors.primary.500',

            secondaryBackground: '$colors.secondary.100',
            secondaryText: '$colors.secondary.700',
            secondaryBorder: '$colors.secondary.200',

            padding: {
                sm: '$spacing.2 $spacing.3',
                md: '$spacing.3 $spacing.4',
                lg: '$spacing.4 $spacing.6'
            },

            borderRadius: '$borderRadius.md'
        },

        Card: {
            background: '$colors.surface.base',
            border: '$colors.border.default',
            shadow: '$shadows.md',
            borderRadius: '$borderRadius.lg',
            padding: '$spacing.6'
        },

        Input: {
            background: '$colors.surface.base',
            border: '$colors.border.default',
            borderFocus: '$colors.primary.500',
            text: '$colors.text.primary',
            placeholder: '$colors.text.tertiary',
            borderRadius: '$borderRadius.md',
            padding: '$spacing.3'
        }
    },

    // Animation specifications
    animations: {
        duration: {
            fast: '150ms',
            normal: '250ms',
            slow: '400ms'
        },

        easing: {
            linear: 'linear',
            ease: 'ease',
            easeIn: 'ease-in',
            easeOut: 'ease-out',
            easeInOut: 'ease-in-out'
        },

        keyframes: {
            fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' }
            },

            slideUp: {
                '0%': { transform: 'translateY(100%)' },
                '100%': { transform: 'translateY(0)' }
            },

            pulse: {
                '0%, 100%': { opacity: '1' },
                '50%': { opacity: '0.5' }
            }
        }
    },

    // Theme variants (optional)
    variants: ['default'],

    // Theme validation function
    validate(config) {
        // Check required color tokens
        const requiredColors = ['primary', 'secondary', 'success', 'warning', 'error'];
        for (const color of requiredColors) {
            if (!config.tokens.colors[color]) {
                return `Missing required color token: ${color}`;
            }
        }

        // Check typography tokens
        if (!config.tokens.typography.fontFamilies.sans) {
            return 'Missing sans-serif font family';
        }

        // Check spacing scale
        const spacingKeys = Object.keys(config.tokens.spacing);
        if (spacingKeys.length < 10) {
            return 'Spacing scale should have at least 10 values';
        }

        return true;
    },

    // Required fields for this theme
    required: ['name', 'tokens'],

    // Theme constraints
    constraints: [
        (config) => {
            // Ensure primary color has proper contrast
            const primary = config.tokens.colors.primary;
            if (!primary || !primary[500]) {
                return 'Primary color must have a 500 shade';
            }
            return true;
        },

        (config) => {
            // Validate spacing scale consistency
            const spacing = config.tokens.spacing;
            const spacingValues = Object.values(spacing).map(v => parseInt(v));

            // Check if spacing increases consistently
            for (let i = 1; i < spacingValues.length; i++) {
                if (spacingValues[i] <= spacingValues[i - 1]) {
                    return 'Spacing scale must increase consistently';
                }
            }
            return true;
        }
    ]
};