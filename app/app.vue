<template>
  <div class="relative min-h-dvh w-full bg-oxy-blue text-white antialiased">
    <NuxtRouteAnnouncer />

    <NuxtLink
      to="/"
      class="fixed top-16 left-18 z-50 block w-40 sm:w-40"
      aria-label="Oxy home"
    >
      <OxyLogo
        swoosh="#fff"
        label=""
        class="h-auto w-full"
      />
    </NuxtLink>

    <HomeButton />

    <NuxtPage />
  </div>
</template>
