/**
 * Motion and Animation Design Tokens
 * Defines duration, easing curves, and animation patterns for consistent motion design
 */

// Animation durations
export const duration = {
    // Instant changes (no animation)
    instant: '0ms',

    // Fast animations (micro-interactions)
    'extra-fast': '100ms',
    fast: '150ms',

    // Standard animations (most UI transitions)
    standard: '200ms',
    medium: '300ms',

    // Slower animations (complex transitions)
    slow: '500ms',
    'extra-slow': '700ms',

    // Very long animations (page transitions, loading states)
    glacial: '1000ms'
}

// Easing curves (based on Material Design 3 motion system)
export const easing = {
    // Linear easing
    linear: 'linear',

    // Standard easing curves
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Material Design 3 emphasis curves
    'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
    'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',

    // Standard Material curves
    'standard': 'cubic-bezier(0.2, 0, 0, 1)',
    'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
    'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',

    // Bounce and elastic curves
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

    // Sharp curves for sudden changes
    'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)'
}

// Component-specific motion configurations
export const componentMotion = {
    // Button animations
    button: {
        // Press animation
        press: {
            duration: duration['extra-fast'],
            easing: easing['emphasized-accelerate'],
            scale: '0.95'
        },
        // Release animation
        release: {
            duration: duration.fast,
            easing: easing['emphasized-decelerate'],
            scale: '1'
        },
        // Ripple effect
        ripple: {
            duration: duration.medium,
            easing: easing['ease-out'],
            scale: '2'
        }
    },

    // Input field animations
    input: {
        // Focus animation
        focus: {
            duration: duration.fast,
            easing: easing['ease-out']
        },
        // Label float animation
        'label-float': {
            duration: duration.standard,
            easing: easing['ease-out']
        },
        // Error state animation
        error: {
            duration: duration.fast,
            easing: easing.bounce
        }
    },

    // Card animations
    card: {
        // Hover elevation
        hover: {
            duration: duration.fast,
            easing: easing['ease-out']
        },
        // Press animation
        press: {
            duration: duration['extra-fast'],
            easing: easing['emphasized']
        }
    },

    // Dialog animations
    dialog: {
        // Enter animation
        enter: {
            duration: duration.medium,
            easing: easing['emphasized-decelerate']
        },
        // Exit animation
        exit: {
            duration: duration.standard,
            easing: easing['emphasized-accelerate']
        },
        // Backdrop fade
        backdrop: {
            duration: duration.fast,
            easing: easing['ease-in-out']
        }
    },

    // Navigation animations
    navigation: {
        // Drawer slide
        drawer: {
            enter: {
                duration: duration.medium,
                easing: easing['emphasized-decelerate']
            },
            exit: {
                duration: duration.standard,
                easing: easing['emphasized-accelerate']
            }
        },
        // Tab indicator
        'tab-indicator': {
            duration: duration.standard,
            easing: easing['emphasized']
        },
        // Page transition
        'page-transition': {
            duration: duration.slow,
            easing: easing['emphasized']
        }
    },

    // Menu and dropdown animations
    menu: {
        // Dropdown enter
        enter: {
            duration: duration.fast,
            easing: easing['emphasized-decelerate']
        },
        // Dropdown exit
        exit: {
            duration: duration['extra-fast'],
            easing: easing['emphasized-accelerate']
        }
    },

    // Toast/Snackbar animations
    toast: {
        // Slide in
        'slide-in': {
            duration: duration.standard,
            easing: easing['emphasized-decelerate']
        },
        // Slide out
        'slide-out': {
            duration: duration.fast,
            easing: easing['emphasized-accelerate']
        }
    },

    // Loading animations
    loading: {
        // Spinner rotation
        spinner: {
            duration: duration.glacial,
            easing: easing.linear,
            iteration: 'infinite'
        },
        // Pulse animation
        pulse: {
            duration: duration.slow,
            easing: easing['ease-in-out'],
            iteration: 'infinite',
            direction: 'alternate'
        },
        // Progress bar
        progress: {
            duration: duration.standard,
            easing: easing['ease-out']
        }
    }
}

// Transition presets for common patterns
export const transitions = {
    // Fade transitions
    fade: {
        enter: `opacity ${duration.fast} ${easing['ease-out']}`,
        exit: `opacity ${duration['extra-fast']} ${easing['ease-in']}`
    },

    // Slide transitions
    slide: {
        up: `transform ${duration.standard} ${easing['emphasized-decelerate']}`,
        down: `transform ${duration.standard} ${easing['emphasized-decelerate']}`,
        left: `transform ${duration.standard} ${easing['emphasized-decelerate']}`,
        right: `transform ${duration.standard} ${easing['emphasized-decelerate']}`
    },

    // Scale transitions
    scale: {
        enter: `transform ${duration.fast} ${easing['emphasized-decelerate']}`,
        exit: `transform ${duration['extra-fast']} ${easing['emphasized-accelerate']}`
    },

    // Color transitions
    color: `color ${duration.fast} ${easing['ease-out']}`,
    'background-color': `background-color ${duration.fast} ${easing['ease-out']}`,
    'border-color': `border-color ${duration.fast} ${easing['ease-out']}`,

    // Size transitions
    width: `width ${duration.standard} ${easing['ease-out']}`,
    height: `height ${duration.standard} ${easing['ease-out']}`,

    // All-purpose smooth transition
    all: `all ${duration.fast} ${easing['ease-out']}`
}

// Animation keyframes for common patterns
export const keyframes = {
    // Fade animations
    fadeIn: {
        from: { opacity: '0' },
        to: { opacity: '1' }
    },
    fadeOut: {
        from: { opacity: '1' },
        to: { opacity: '0' }
    },

    // Slide animations
    slideInUp: {
        from: { transform: 'translateY(100%)' },
        to: { transform: 'translateY(0)' }
    },
    slideInDown: {
        from: { transform: 'translateY(-100%)' },
        to: { transform: 'translateY(0)' }
    },
    slideInLeft: {
        from: { transform: 'translateX(-100%)' },
        to: { transform: 'translateX(0)' }
    },
    slideInRight: {
        from: { transform: 'translateX(100%)' },
        to: { transform: 'translateX(0)' }
    },

    // Scale animations
    scaleIn: {
        from: { transform: 'scale(0)' },
        to: { transform: 'scale(1)' }
    },
    scaleOut: {
        from: { transform: 'scale(1)' },
        to: { transform: 'scale(0)' }
    },

    // Rotation animations
    spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' }
    },

    // Pulse animation
    pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' }
    },

    // Bounce animation
    bounce: {
        '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
        '40%, 43%': { transform: 'translateY(-30px)' },
        '70%': { transform: 'translateY(-15px)' },
        '90%': { transform: 'translateY(-4px)' }
    },

    // Ripple effect
    ripple: {
        '0%': {
            transform: 'scale(0)',
            opacity: '0.6'
        },
        '100%': {
            transform: 'scale(2)',
            opacity: '0'
        }
    }
}

// Motion accessibility preferences
export const motionPreferences = {
    // Reduced motion settings (for users who prefer reduced motion)
    reduced: {
        duration: duration.instant,
        easing: easing.linear,
        scale: '1', // No scaling animations
        translateX: '0', // No slide animations
        translateY: '0',
        rotate: '0deg' // No rotation animations
    },

    // High motion settings (for users who enjoy rich animations)
    enhanced: {
        duration: duration.slow,
        easing: easing.bounce,
        enableParallax: true,
        enableComplexAnimations: true
    }
}

// Complete motion export
export const motionTokens = { duration, easing, componentMotion, transitions, keyframes, motionPreferences }