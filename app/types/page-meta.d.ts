declare module '#app' {
  interface PageMeta {
    /** Colour of the fixed Home button label on this page. Any CSS colour. */
    homeTextColor?: string
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    homeTextColor?: string
  }
}

export {}
