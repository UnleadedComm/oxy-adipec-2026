<script setup lang="ts">
/**
 * Oxy Ecosystem Explorer — interactive Three.js "Connecting resources" scene.
 *
 * Markup + styles ported from the agency handoff package; the engine lives in
 * app/lib/ecosystem/scene.js and is loaded on the client after mount. The
 * explorer addresses its DOM by id, so mount at most one instance per page.
 *
 * Fills its container's width and the viewport height. The host page should
 * paint the #f2f3f5 backdrop behind it.
 */
const props = withDefaults(defineProps<{
  /** GLB served from /public. */
  modelUrl?: string
  /** Directory holding the Draco decoder (draco_decoder.js/.wasm, draco_wasm_wrapper.js). */
  dracoPath?: string
  /**
   * Overrides merged over the scene's BAKED_LOOK (see CONFIG in app/lib/ecosystem/scene.js).
   * Screen nudges are in px at a 1920x1080 reference; +Y is up.
   */
  config?: Record<string, unknown>
}>(), {
  modelUrl: '/ecosystem/ecosystem.glb',
  dracoPath: '/ecosystem/draco/',
  config: () => ({
    frameY: -20, // home view sits lower under the taller header (baked: 15)
    headerMaxFrac: 0.32, // let the header reserve follow the extra top padding (baked: 0.26)
  }),
})

const { t } = useI18n()
const root = useTemplateRef<HTMLElement>('root')

const tabs = ['oilgas', 'power', 'water', 'co2'] as const

let explorer: { dispose: () => void } | null = null
let unmounted = false

onMounted(async () => {
  // Dynamic import keeps three.js out of the server bundle and the initial payload.
  const { createEcosystemScene } = await import('~/lib/ecosystem/scene')
  if (unmounted || !root.value) return
  explorer = createEcosystemScene(root.value, {
    modelUrl: props.modelUrl,
    dracoPath: props.dracoPath,
    fontFamily: getComputedStyle(root.value).fontFamily,
    config: props.config,
  })
})

onBeforeUnmount(() => {
  unmounted = true
  explorer?.dispose()
  explorer = null
})
</script>

<template>
  <div
    ref="root"
    class="ecosystem-explorer booting"
  >
    <section class="explore-section">
      <div
        id="headerBar"
        class="header-bar"
      />
      <h1 class="explore-title text-oxy-blue! text-6xl! font-semibold! mb-8!">
        {{ t('ecosystem.title') }}
      </h1>

      <div
        id="tabs"
        class="tabs"
      >
        <template
          v-for="(tab, i) in tabs"
          :key="tab"
        >
          <span
            v-if="i > 0"
            class="tab-divider"
            aria-hidden="true"
          />
          <button
            class="tab-btn"
            type="button"
            :data-tab="tab"
          >
            {{ t(`ecosystem.tabs.${tab}`) }}
          </button>
        </template>
      </div>

      <div
        id="viewerWrap"
        class="viewer-wrap"
      >
        <div
          id="loader"
          class="loader"
        >
          <div class="loader-ripple">
            <b /><b /><b />
            <OxyLogo
              class="loader-logo"
              swoosh="var(--color-oxy-blue)"
              wordmark="var(--color-oxy-red)"
              label=""
            />
          </div>
          <div
            id="loaderPct"
            class="loader-pct"
          >
            0%
          </div>
          <span id="loaderText">{{ t('ecosystem.loading') }}</span>
          <div class="loader-bar">
            <i id="loaderBar" />
          </div>
        </div>

        <canvas id="scene-canvas" />

        <div
          id="dacHotspot"
          class="hotspot"
          style="display: none"
          title="Take a closer look"
        >
          <span class="hs-ring" />
          <span class="hs-ring hs-ring2" />
          <span class="hs-core" />
        </div>
        <div
          id="calloutChip"
          class="callout-chip"
        />
        <div
          id="partPanel"
          class="part-panel"
        />

        <div
          id="viewerHint"
          class="viewer-hint"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M12 2v20M2 12h20" />
            <circle
              cx="12"
              cy="12"
              r="9"
            />
          </svg>
          {{ t('ecosystem.hint') }}
        </div>

        <div
          id="infoStack"
          class="info-stack"
        >
          <div
            id="infoPanel"
            class="info-panel"
            style="display: none"
          >
            <button
              id="panelReturn"
              class="panel-return"
              type="button"
              :title="t('ecosystem.backToOverview')"
              :aria-label="t('ecosystem.backToOverview')"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </button>
            <span
              id="infoTag"
              class="info-tag"
            >Integration</span>
            <h4
              id="infoTitle"
              class="info-title"
            />
            <p
              id="infoDesc"
              class="info-desc"
            />
            <div
              id="infoChips"
              class="info-chips"
            />
            <div class="panel-footer">
              <a
                id="infoLink"
                class="explore-btn"
                href="#"
                rel="noopener"
              >
                <span id="infoLinkText">Explore</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <button
                id="tourBtn"
                class="tour-btn"
                type="button"
              >
                ▶&nbsp;&nbsp;Play the story
              </button>
            </div>
            <div
              id="crumbs"
              class="panel-crumbs"
            />
            <div
              id="facilityPanel"
              class="fac-inset"
              style="display: none"
            >
              <div class="info-head">
                <h4 id="facTitle" />
              </div>
              <p id="facDesc" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div
      id="hoverChip"
      class="hover-chip"
    />
  </div>
</template>

<style src="~/assets/css/ecosystem.css"></style>
