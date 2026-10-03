declare module '#app' {
  interface PageMeta {
    /** Colour of the fixed Home button label on this page. Any CSS colour. */
    homeTextColor?: string
    /** Fill of the fixed Oxy logo swooshes on this page. Any CSS colour. Defaults to white. */
    logoSwoosh?: string
    /** Fill of the fixed Oxy logo wordmark on this page. Any CSS colour. Defaults to white. */
    logoWordmark?: string
    /** Render the fixed locale switcher in brand blue for light backgrounds. Defaults to white. */
    localeSwitcherInverted?: boolean
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    homeTextColor?: string
    logoSwoosh?: string
    logoWordmark?: string
    localeSwitcherInverted?: boolean
  }
}

export {}
