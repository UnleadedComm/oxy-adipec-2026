/* ============================================================================
   OXY ECOSYSTEM EXPLORER — v2
   ----------------------------------------------------------------------------
   Loads Staging_V5 (all 8 facilities + Connections) and recreates the Spline
   interaction: the camera orbits softly as the mouse moves, with damping.

   Everything tweakable lives in CONFIG / PATHWAYS just below, and most of it
   is also exposed in the on-page "Render & Interaction Settings" panel.
   ========================================================================== */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'

/* ----------------------------------------------------------------------------
   NUXT PORT — the handoff package's main.js, wrapped in a factory.
   - Scoped to `root` (the component element) instead of `document`.
   - The on-page tuning drawer is gone; BAKED_LOOK (Cody's approved look) is
     merged into CONFIG up front and the few derived values are applied in
     applyBakedLook(). Pass `config` in options to override any key.
   - Window/document listeners, timers and GPU resources are released by dispose().
---------------------------------------------------------------------------- */

/**
 * @typedef {object} EcosystemSceneOptions
 * @property {string} [modelUrl]   GLB URL (default: /ecosystem/ecosystem.glb)
 * @property {string} [dracoPath]  Directory holding the Draco decoder files
 * @property {string} [fontFamily] CSS font stack for the 3D nameplates
 * @property {Record<string, unknown>} [config] Overrides merged over BAKED_LOOK
 */

/**
 * Boot the Oxy Ecosystem Explorer inside `root`.
 * @param {HTMLElement} root  Element containing the explorer markup (see EcosystemScene.vue)
 * @param {EcosystemSceneOptions} [options]
 */
export function createEcosystemScene(root, options = {}) {
  const opts = {
    modelUrl: '/ecosystem/ecosystem.glb',
    dracoPath: '/ecosystem/draco/',
    fontFamily: 'Spezia, ui-sans-serif, system-ui, sans-serif',
    config: null,
    ...options,
  }
  const hostEl = root // `root` is shadowed inside setupModel/registerFlag by the GLTF root
  const $id = id => hostEl.querySelector('#' + id)
  const BUILD_TAG = '2026-09-20 v18-layout (nuxt port)'
  let disposed = false
  // window/document listeners and timers are tracked so dispose() can undo them
  const listeners = []
  const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); listeners.push([target, type, fn, o]) }
  const timers = new Set()
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn() }, ms); timers.add(id); return id }

  // BAKED LOOK — Cody's approved Lock Look (Jul 2026), shipped as the built-in
  // default. Merged over CONFIG below, before anything reads it.
  const BAKED_LOOK = { exposure: 1, toneMap: 5, pixelRatio: 2, envInt: 0.35, ambient: 0.13, hemi: 0.37, fill: 0.28, matEnv: 0.5, sunInt: 2.7, sunColor: '#ffffff', sunAzimuth: 60, sunElevation: 54, spinSun: false, spinSunSpeed: 20, shadowOn: true, shadowDark: 0.66, shadowRadius: 8.3, shadowBias: -0.0004, shadowMap: 2048, shadowTint: '#7f8896', bg: '#f2f3f5', flagSpeed: 3, flagAmp: 0.135, flagFlip: true, hbHeight: 258, hbColor: '#ffffff', hbAlpha: 1, hbGrad: true, hbColor2: '#f2f3f5', hbAlpha2: 0, baseAz: 150, baseEl: 30, zoom: 1.16, targetY: -0.03, frameX: -45, frameY: 15, frameXTab: 76, frameYTab: -8, frameXFocus: 71, frameYFocus: 0, swayX: 13, swayY: 4.5, damping: 3.2, invertX: false, invertY: true, dragOn: false, wheelZoom: false, hoverLift: 0.95, dimOpacity: 0.18, dimDesat: 1, activeLift: 0, hlSpeed: 3.5, focusCam: true, panelX: 58, panelY: 104, panelW: 358, glassBlur: 20, glassAlpha: 0.79, glassSat: 1.05, pshX: 0, pshY: 12, pshBlur: 44, pshOpacity: 0.16, pshColor: '#16223a', ppEnabled: true, smaaOn: true, aoOn: true, aoBlend: 0.85, aoRadius: 0.53, aoScale: 1.95, aoThickness: 1.15, aoDistExp: 1, bloomOn: false, bloomStrength: 0.21, bloomRadius: 0.28, bloomThreshold: 0.96, dofOn: false, dofFocus: 95, dofAperture: 1, dofMaxblur: 0.008, sharpenOn: false, sharpenAmount: 0.4, chromaticOn: false, chromaticAmount: 0.003, vignetteOn: false, vignetteAmount: 0.5, focusPad: 1.07, focusHeight: 0.33, hsColor: '#2e8ef7', hsSize: 21, hsSpeed: 2.4, hsOpacity: 1, hsOffX: 0.1, hsOffY: 1.2, hsOffZ: 0, hsAz: 234, hsEl: 33, hsZoom: 0.54, dacHovColor: '#005fb8', dacHovStrength: 0.9, dacHovFade: 3.5, eorHovColor: '#0084ff', eorHovStrength: 1.25, hsEorOffX: 0, hsEorOffY: 1.2, hsEorOffZ: 0, hsEorAz: 225, hsEorEl: 28, hsEorZoom: 0.75, hsSeqOffX: 2.4, hsSeqOffY: -2.3, hsSeqOffZ: -2.5, hsSeqAz: 225, hsSeqEl: 28, hsSeqZoom: 0.75, hsMidOffX: 0, hsMidOffY: 1.2, hsMidOffZ: 0, hsMidAz: 225, hsMidEl: 28, hsMidZoom: 0.75, hsWatOffX: 0, hsWatOffY: 1.2, hsWatOffZ: 0, hsWatAz: 225, hsWatEl: 28, hsWatZoom: 0.75, tourDwell: 9, calloutSecs: 4, lblOn: true, lblHoverOnly: true, lblSize: 2.95, lblFont: 72, lblWeight: 700, lblItalic: false, lblTextColor: '#1c2430', lblPillColor: '#ffffff', lblPillOp: 0.95, lblRadius: 200, lblPadX: 62, lblPadY: 48, lblDotOn: true, lblDotColor: '#e0342e', lblDotSize: 18, lblShBlur: 24, lblShOp: 0.35, lblShOffY: 10, lblAlong: 4.8, lblAway: 2.3, lblHeight: 2.4, lblYaw: 180, lblTilt: 90, lblGhost: 0.28, lblFocusScale: 0.55, waterSpeed: 2.31, waterAmp: 0.69, waterScale: 8, waterWarp: 0.8, waterSwell: 0.028, waterRough: 0, waterGloss: 0.525, waterReflect: 3, waterTint: '#274853', waterSkyColor: '#6eaecf', dmExp: 0.25, dmBright: 1.24, dmGamma: 1, dmMetal: -0.51, dmRough: 0, fanRpm: 25, airOn: true, airColor: '#7fd4ff', airPerFan: 1, airReach: 3.8, airHeight: 1.9, airSide: 1.3, airDrop: 0.9, airFlow: 1.37, airDash: 6, airOpacity: 0.66, airThick: 0.03, airFocusOnly: true, flowOn: true, flowSpeed: 1.39, flowDash: 1.1, flowGap: 0.1, flowThick: 0.09, flowOpacity: 1, flowGhost: 0, flowHeight: 0.15, flowRadius: 1.5, flowHoverMul: 5, flowColOil: '#2fa84f', flowColPower: '#e0342e', flowColWater: '#d9a516', flowColCo2: '#1e6fd9', ringsOn: true, ringColor: '#75d1ff', ringScale: 2, ringPeriod: 4.5, ringOpacity: 0.51, ringTube: 0.06, ringCount: 4, ringTilt: 0, ringOffX: -0.35, ringOffY: -0.15, ringOffZ: 0.3, ringMaskTop: 0.7, ringMaskSoft: 0.8, seqOffX: 0, seqOffY: 0, seqOffZ: 0, seqMaskTop: 1.2, seqTilt: 0, pipeOn: true, pipeColor: '#e6e6e6', pipeMetal: 0.59, pipeRough: 0.34, earthOn: true, earthBright: 1, earthEmissive: 0, earthRough: 0.72, earthMetal: 0, wellheadOn: false, wellheadColor: '#c0261f', wellheadMetal: 0.24, wellheadRough: 0.2, showFps: false }

  /* ----------------------------------------------------------------------------
   CONFIG — defaults ported from the Omma build (lighting kept 1:1)
---------------------------------------------------------------------------- */
  const CONFIG = {
  // Renderer
    exposure: 1.0, toneMap: 5, pixelRatio: 2,
    // Environment / fill
    envInt: 0.32, ambient: 0.12, hemi: 0.45, fill: 0.25, matEnv: 0.5,
    // Sun — az 20 puts the light front-left of the 135° camera (Omma's 325 was
    // authored for models rotated -135°; unrotated here it became a backlight)
    sunInt: 3.4, sunColor: '#ffffff', sunAzimuth: 20, sunElevation: 58,
    spinSun: false, spinSunSpeed: 20,
    // Shadows — neutral cool gray, not blue
    shadowOn: true, shadowDark: 0.25, shadowRadius: 5, shadowBias: -0.0004,
    shadowMap: 2048, shadowTint: '#7f8896',
    // Scene
    bg: '#f2f3f5',
    flagSpeed: 0.55, flagAmp: 0.16, flagFlip: true, // rig flag wave (0 = still)
    // Header bar — the strip behind the title/tabs. Solid page color by
    // default (looks unchanged); dial opacity/gradient to blend it away.
    hbHeight: 258, hbColor: '#f2f3f5', hbAlpha: 1,
    hbGrad: true, hbColor2: '#f2f3f5', hbAlpha2: 0,
    // Camera (base view — matches the reference JPG framing; tune live)
    baseAz: 135, baseEl: 30, zoom: 1.0, targetY: 0.28, // targetY = fraction of scene height
    frameX: -45, frameY: 15, // home (wide) view screen nudge in px (+X right, +Y up)
    frameXTab: 25, frameYTab: 15, // tab (pathway) views get their own nudge
    frameXFocus: 0, frameYFocus: 0, // facility close-up (click-to-focus) nudge
    fitBoost: 0.5, // small-screen boost: scale the scene up as the window gets short (0 = off)
    headerMaxFrac: 0.26, // max fraction of the window the header may reserve — on short
    // windows the scene rides up behind the header instead of shrinking
    // Mouse-orbit interaction (the Spline feel)
    swayX: 9, // degrees of azimuth sway, full mouse travel left<->right
    swayY: 5, // degrees of elevation sway, full mouse travel up<->down
    damping: 3.2, // lower = lazier / floatier, higher = snappier
    invertX: false, invertY: false,
    dragOn: true, // click-drag adds extra orbit on top of the sway
    wheelZoom: false, // off by default so the page scrolls normally
    hoverLift: 0.35, // how far a facility rises when hovered
    // Pathway highlight
    dimOpacity: 0.14, dimDesat: 0.85, activeLift: 0.45, hlSpeed: 3.5, focusCam: true,
    // Info panel placement (px; initialized from the rendered position)
    panelX: 16, panelY: 18, panelW: 470,
    // Info panel frosted glass
    glassBlur: 18, glassAlpha: 0.72, glassSat: 1.4,
    // Info panel drop shadow (matches the settings drawer by default)
    pshX: 0, pshY: 12, pshBlur: 44, pshOpacity: 0.16, pshColor: '#16223a',
    // Post
    ppEnabled: true, smaaOn: true,
    aoOn: true, aoBlend: 0.85, aoRadius: 0.5, aoScale: 1, aoThickness: 1, aoDistExp: 1,
    bloomOn: false, bloomStrength: 0.25, bloomRadius: 0.4, bloomThreshold: 0.85,
    dofOn: false, dofFocus: 100, dofAperture: 0.6, dofMaxblur: 0.008,
    sharpenOn: false, sharpenAmount: 0.4,
    chromaticOn: false, chromaticAmount: 0.003,
    vignetteOn: false, vignetteAmount: 0.5,
    // Click-to-focus framing (smaller = camera goes in closer)
    focusPad: 1.15,
    focusHeight: 0.34, // look-at height within the focused tile (0 = base, 1 = top)
    // DAC hotspot — pulsing dot; click flies to an alternate close-up view
    hsColor: '#2e8ef7', hsSize: 18, hsSpeed: 1.8, hsOpacity: 0.95,
    hsOffX: 0, hsOffY: 2, hsOffZ: 0, // dot anchor relative to the DAC tile center
    hsAz: 225, hsEl: 30, // camera orientation of the hotspot view (front corner)
    hsZoom: 0.7, // extra closeness vs the normal DAC focus
    dacHovColor: '#4f9dff', dacHovStrength: 0.8, dacHovFade: 9, // part hover (hotspot view only)
    eorHovColor: '#3f8cff', eorHovStrength: 1.6, // EOR's lighter materials need a harder push
    // Close-view dots for four more facilities (same mechanic as the DAC dot)
    hsEorOffX: 0, hsEorOffY: 1.2, hsEorOffZ: 0, hsEorAz: 225, hsEorEl: 28, hsEorZoom: 0.75,
    hsSeqOffX: 0, hsSeqOffY: -4, hsSeqOffZ: 0, hsSeqAz: 225, hsSeqEl: 28, hsSeqZoom: 0.75, // info dot at the notch base
    hsMidOffX: 0, hsMidOffY: 1.2, hsMidOffZ: 0, hsMidAz: 225, hsMidEl: 28, hsMidZoom: 0.75,
    hsWatOffX: 0, hsWatOffY: 1.2, hsWatOffZ: 0, hsWatAz: 225, hsWatEl: 28, hsWatZoom: 0.75,
    tourDwell: 4, // seconds per stop in "Play the story"
    calloutSecs: 4, // how long part / flow-line callout chips linger
    // 3D nameplates (concept #4 — ground pills along each tile's front corner)
    lblOn: true,
    lblHoverOnly: true, // plates appear only while hovering their tile
    lblSize: 2.0, // world height of the pill
    lblFont: 64, // texture font px (proportions vs padding)
    lblWeight: 700, lblItalic: false,
    lblTextColor: '#1c2430', lblPillColor: '#ffffff', lblPillOp: 0.95,
    lblRadius: 200, lblPadX: 40, lblPadY: 22,
    lblDotOn: true, lblDotColor: '#e0342e', lblDotSize: 18,
    lblShBlur: 24, lblShOp: 0.35, lblShOffY: 10,
    // Plate stands against the tile's front-RIGHT earth wall as seen on screen.
    // Position is in the PLATE's own frame so the sliders stay intuitive at any
    // Yaw: Along slides it left/right along the wall, Away floats it off the
    // earth layers, Height rides the strata band. Yaw 180° = parallel to that
    // wall; 135° = square to the camera. Tilt 90° = standing upright.
    lblAlong: 3.5, lblAway: 1.2, lblHeight: 2.4,
    lblYaw: 180, lblTilt: 90,
    lblGhost: 0.25, // opacity floor when the tile is ghosted
    lblFocusScale: 0.55, // plate shrinks to this × size in the close-up
    // Water surface (clarifier basins)
    waterSpeed: 0.5, waterAmp: 0.35, waterScale: 2.5, waterWarp: 0.8, waterSwell: 0.035,
    waterRough: 0.28, waterGloss: 0.12, waterReflect: 1.0, waterTint: '#5d93b4', waterSkyColor: '#eef6fb',
    // DAC metal adjustment layer (sits on top of the baked textures)
    dmExp: 0, dmBright: 1, dmGamma: 1, dmMetal: 0, dmRough: 0,
    // DAC fans
    fanRpm: 16, // rotations per minute (0 = stopped)
    // DAC air-intake lines (dotted streams flowing into each fan)
    airOn: true, airColor: '#7fd4ff', airPerFan: 1, airReach: 6, airHeight: 3.5,
    airSide: 1.3, airDrop: 0.9, // wall entry: out past the roof edge, mid-face
    airFlow: 0.45, airDash: 9, airOpacity: 0.75, airThick: 0.07,
    airFocusOnly: true, // lines fade in only while the DAC tile is click-focused
    // Flow lines between tiles (per Oxy_Website_Diagram_V4.pdf)
    flowOn: true, flowSpeed: 0.5, flowDash: 0.55, flowGap: 0.45, flowThick: 0.12,
    flowOpacity: 0.9, flowGhost: 0.1, flowHeight: 0.15, flowRadius: 1.5,
    flowHoverMul: 5, // hover/inspect swell — how many × thicker the route grows
    flowColOil: '#2fa84f', flowColPower: '#e0342e', flowColWater: '#d9a516', flowColCo2: '#1e6fd9',
    // CO₂ rings — expanding wavefronts on the cutaway walls (EOR injection)
    ringsOn: true, ringColor: '#3fc0ff', ringScale: 1, ringPeriod: 4.5,
    ringOpacity: 0.9, ringTube: 0.06, ringCount: 4, ringTilt: 0,
    ringOffX: 0, ringOffY: 0, ringOffZ: 0,
    ringMaskTop: 1.2, // world units above the emitter where arcs get cropped
    ringMaskSoft: 0.8, // softness of that crop edge
    // Sequestration emitter placement (look params above are shared)
    seqOffX: 0, seqOffY: 0, seqOffZ: 0, seqMaskTop: 1.2, seqTilt: 0,
    // Material overrides (opt-in — the baked textures are untouched while off)
    pipeOn: false, pipeColor: '#b8bcc2', pipeMetal: 0.43, pipeRough: 0.20,
    earthOn: false, earthBright: 1, earthEmissive: 0, earthRough: 0.6, earthMetal: 0,
    wellheadOn: false, wellheadColor: '#c0261f', wellheadMetal: 1, wellheadRough: 0.32,
    showFps: false,
  }
  Object.assign(CONFIG, BAKED_LOOK, opts.config || {})

  /* ----------------------------------------------------------------------------
   PATHWAYS — which facilities + connection lines light up per tab.
   Facility keys match node names in Staging_V5.glb (matched loosely, so
   "RIG WEB" / "Rig_WEB" etc. all resolve). Edit freely.
   NOTE: LITHIUM WEB has no connection geometry in the model, so it is not in
   any pathway yet — add 'lithium' to a facilities list to include it.
---------------------------------------------------------------------------- */
  // Per-facility focus overrides: focusPadMul multiplies the global Focus Zoom
  // (smaller = closer), focusHeight overrides the global look-at height.
  const FACILITY_DEFS = {
    rig: { match: /rig/i, label: 'Oil and Gas', cat: 'Core Business', desc: 'We operate a balanced portfolio of conventional and unconventional resources across the United States, the Middle East and North Africa. Combined with advanced recovery expertise and targeted exploration, these assets provide more than 30 years of development opportunity.', focusPadMul: 0.8, focusHeight: 0.26 },
    midstream: { match: /midstream/i, label: 'Midstream and Marketing', cat: 'Core Business', desc: 'Our midstream and marketing business connects production to market through a network of gathering, processing, transportation and storage assets. These capabilities help move resources efficiently across our operations.' },
    eor: { match: /eor/i, label: 'Enhanced Oil Recovery', cat: 'Core Business', desc: 'Enhanced oil recovery is a core competitive advantage that combines CO₂ management, infrastructure and technical expertise to expand resource potential across our portfolio.', focusPadMul: 0.8 },
    power: { match: /power/i, label: 'Lower Carbon Power', cat: 'Core Business', desc: 'Lower-carbon power and electrification is an important part of our integrated system, helping meet operational energy needs and creating opportunities to support growing demand from data centers and other power-intensive industries.', focusPadMul: 1.12 }, // flat tile fits tight — back the close-up out
    water: { match: /water/i, label: 'Water Management', cat: 'Core Business', desc: 'Water management supports production and advanced recovery across our integrated system. Through water treatment and recycling, we help maximize the use of existing resources while minimizing freshwater demand.', focusPadMul: 1.12 }, // flat tile fits tight — back the close-up out
    dac: { match: /dac/i, label: 'Direct Air Capture', cat: 'Low Carbon Ventures', desc: 'As part of our integrated system, Direct Air Capture can support EOR or geologic sequestration, creating opportunities for lower-carbon products, fuels and carbon dioxide removal credits.', focusPadMul: 0.9 },
    sequestration: { match: /sequestration/i, label: 'CO₂ Sequestration', cat: 'Low Carbon Ventures', desc: 'Dedicated sequestration creates opportunities to store CO₂ from industrial sources and enable lower-carbon products. Leveraging our subsurface and CO₂ expertise, we help customers manage emissions through geologic storage.' },
    lithium: { match: /lithium/i, label: 'Lithium Production', cat: 'Low Carbon Ventures', desc: 'We’re advancing direct lithium extraction technologies designed to produce high-purity lithium compounds from brines while supporting a more secure and reliable domestic supply of critical minerals.', focusPadMul: 0.9 },
  }

  // Tab definitions — active tiles per Oxy_Website_Diagram_V4.pdf.
  // (The GLB's baked "Connections" geometry is superseded by the animated flow
  // lines below, so `connections` stays empty and that group remains hidden.)
  // Panel content per tab: integration copy, facility chips (key, label, dot
  // color), and the Explore link. Point `href` at the deep-dive pages when they
  // exist; '#' renders the link but goes nowhere.
  const PATHWAYS = {
    oilgas: {
      title: 'Oil and Gas', tag: 'Core Business',
      desc: 'Oil and gas production is the core of our business. From primary production and enhanced oil recovery to midstream and marketing, water management, lower-carbon power and Direct Air Capture, our capabilities are connected through a system designed to get more from every asset.',
      facilities: ['rig', 'midstream', 'power', 'eor', 'water', 'dac'],
      connections: [],
      chips: [['rig', 'Oil and Gas', '#2fa84f'], ['midstream', 'Midstream', '#2fa84f'], ['eor', 'EOR', '#2fa84f'], ['power', 'Power', '#2fa84f'], ['water', 'Water', '#2fa84f'], ['dac', 'DAC', '#2fa84f']],
      link: { label: 'Explore Oil and Gas', href: '#' },
    },
    power: {
      title: 'Power', tag: 'Core Business',
      desc: 'Reliable power is essential to our operations. Managing power as part of an integrated system helps support oil and gas production, enhanced oil recovery and Direct Air Capture while improving energy efficiency.',
      facilities: ['rig', 'power', 'eor', 'dac', 'lithium'],
      connections: [],
      chips: [['power', 'Power', '#e0342e'], ['rig', 'Oil and Gas', '#e0342e'], ['eor', 'EOR', '#e0342e'], ['dac', 'DAC', '#e0342e'], ['lithium', 'Lithium', '#e0342e']],
      link: { label: 'Explore Power', href: '#' },
    },
    water: {
      title: 'Water', tag: 'Core Business',
      desc: 'Water management is an important aspect of producing oil and gas. Moving, treating and reusing water is a critical part of supporting safe, reliable and efficient operations across our business.',
      facilities: ['rig', 'eor', 'water'],
      connections: [],
      chips: [['water', 'Water', '#d9a516'], ['rig', 'Oil and Gas', '#d9a516'], ['eor', 'EOR', '#d9a516']],
      link: { label: 'Explore Water Management', href: '#' },
    },
    co2: {
      title: 'CO₂', tag: 'Low Carbon Ventures',
      desc: 'Oxy has a unique capability in managing, processing, transporting and storing CO₂. We leverage that expertise to support advanced recovery and to progress integrated technologies that expand opportunities across our business.',
      facilities: ['power', 'eor', 'dac', 'sequestration'],
      connections: [],
      chips: [['dac', 'DAC', '#1e6fd9'], ['eor', 'EOR', '#1e6fd9'], ['sequestration', 'Sequestration', '#1e6fd9'], ['power', 'Power', '#1e6fd9']],
      link: { label: 'Explore CO₂ and DAC', href: '#' },
    },
  }

  /* ----------------------------------------------------------------------------
   FLOW LINES — animated dashed streams between tiles (Oxy_Website_Diagram_V4).
   from → to sets the dash travel direction; `both` builds a return line too.
   `mid` = world X/Z waypoint routing the curve through the tile gaps.
   tabs = when this line stays active; otherwise it ghosts with the tiles.
---------------------------------------------------------------------------- */
  const FLOW_LINES = [
  // Straight segments with hard elbows. `via` = intermediate world [x,z]
  // waypoints routed through the tile gaps; empty = a single straight run.
  // GREEN — oil & gas product to midstream
    { id: 'G1', family: 'oil', from: 'rig', to: 'midstream', tabs: ['oilgas'], via: [] },
    { id: 'G2', family: 'oil', from: 'eor', to: 'midstream', tabs: ['oilgas'], via: [] },
    // RED — power distribution
    { id: 'R1', family: 'power', from: 'power', to: 'rig', tabs: ['oilgas', 'power'], via: [] },
    { id: 'R2', family: 'power', from: 'power', to: 'eor', tabs: ['oilgas', 'power'], via: [], shift: [-3.0, 0] },
    { id: 'R3', family: 'power', from: 'power', to: 'dac', tabs: ['oilgas', 'power'], via: [] },
    // GOLD — water
    { id: 'Y1', family: 'water', from: 'rig', to: 'water', tabs: ['oilgas', 'water'], via: [] },
    // v18 layout (Oil and Gas centered): every line is a straight run between
    // neighbors or a straight diagonal through a tile gap — no waypoints needed.
    { id: 'Y2', family: 'water', from: 'water', to: 'eor', tabs: ['water'], via: [] },
    // BLUE — CO₂ / net power
    { id: 'B1', family: 'co2', from: 'power', to: 'eor', tabs: ['co2'], via: [], shift: [-1.2, 0] },
    { id: 'B2', family: 'co2', from: 'dac', to: 'eor', tabs: ['co2'], via: [] },
    { id: 'B3', family: 'co2', from: 'dac', to: 'sequestration', tabs: ['co2'], via: [], shift: [0, 2.2] },
  ]
  // All flow lines wear one color (review decision: no mixed line colors)
  const FLOW_FAMILY_COLOR = { oil: 'flowColCo2', power: 'flowColCo2', water: 'flowColCo2', co2: 'flowColCo2' }
  // One story, one color: with a tab active, every line/chip/plate dot wears the
  // tab's theme. The mixed cargo colors survive only on the overview map.
  const PATHWAY_THEME = { oilgas: 'flowColCo2', power: 'flowColCo2', water: 'flowColCo2', co2: 'flowColCo2' }

  /* ----------------------------------------------------------------------------
   DOM
---------------------------------------------------------------------------- */
  const wrap = $id('viewerWrap')
  const canvas = $id('scene-canvas')
  const loaderEl = $id('loader')
  const loaderText = $id('loaderText')
  const loaderPct = $id('loaderPct')
  const loaderBar = $id('loaderBar')
  const LOADER_LINES = ['Surveying the site…', 'Raising the derrick…', 'Spinning up the DAC fans…', 'Filling the clarifiers…', 'Pressurizing pipelines…', 'Charging flow lines…', 'Warming the calciner…', 'Final checks…']
  function setLoaderProgress(frac, label) {
    const f = Math.min(Math.max(frac, 0), 1)
    if (loaderPct) loaderPct.textContent = Math.round(f * 100) + '%'
    if (loaderBar) loaderBar.style.width = (f * 100) + '%'
    loaderText.textContent = label || LOADER_LINES[Math.min(Math.floor(f * LOADER_LINES.length), LOADER_LINES.length - 1)]
  }
  const viewerHint = $id('viewerHint')
  const hoverChip = $id('hoverChip')
  const infoStack = $id('infoStack')
  const infoPanel = $id('infoPanel')
  const infoTitle = $id('infoTitle')
  const infoDesc = $id('infoDesc')
  const infoTag = $id('infoTag')
  const infoChips = $id('infoChips')
  const infoLink = $id('infoLink')
  const infoLinkText = $id('infoLinkText')
  const facilityPanel = $id('facilityPanel')
  const facTitle = $id('facTitle')
  const facDesc = $id('facDesc')
  infoLink.addEventListener('click', (e) => { if (infoLink.getAttribute('href') === '#') e.preventDefault() })

  // Card enter/exit: display toggling + a two-frame class flip so the
  // opacity/translate transition actually plays on entry.
  function cardClearInline(el) {
    el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''
  }
  function cardShow(el) {
    clearTimeout(el._hideT); clearTimeout(el._hopT)
    cardClearInline(el)
    if (el.style.display !== 'block') {
      el.style.display = 'block'
      el.classList.add('hide')
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('hide')))
    }
    else {
      el.classList.remove('hide')
    }
  }
  function cardHide(el) {
    if (el.style.display === 'none') return
    clearTimeout(el._hopT)
    cardClearInline(el)
    el.classList.add('hide')
    clearTimeout(el._hideT)
    el._hideT = setTimeout(() => { el.style.display = 'none' }, 320)
  }
  const fpsMeter = $id('fpsMeter')

  loaderText.textContent = 'Starting engine…'
  console.log('[explorer] boot — three r' + THREE.REVISION)

  /* ----------------------------------------------------------------------------
   RENDERER / SCENE / CAMERA
---------------------------------------------------------------------------- */
  const scene = new THREE.Scene()
  scene.background = null // page CSS provides the #f2f3f5 backdrop

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setSize(wrap.clientWidth, wrap.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.pixelRatio))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = CONFIG.exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture
  scene.environmentIntensity = CONFIG.envInt

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 1000)

  /* ----------------------------------------------------------------------------
   LIGHTS (Omma rig, 1:1)
---------------------------------------------------------------------------- */
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd6cfc4, CONFIG.hemi)
  scene.add(hemiLight)
  const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.ambient)
  scene.add(ambientLight)

  const sun = new THREE.DirectionalLight(0xffffff, CONFIG.sunInt)
  sun.castShadow = true
  sun.shadow.mapSize.set(CONFIG.shadowMap, CONFIG.shadowMap)
  sun.shadow.bias = CONFIG.shadowBias
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = CONFIG.shadowRadius
  scene.add(sun, sun.target)

  const fillLight = new THREE.DirectionalLight(0xddeeff, CONFIG.fill)
  fillLight.position.set(6, 8, -6)
  scene.add(fillLight)

  let sceneBox = null
  function sunDir() {
    const az = THREE.MathUtils.degToRad(CONFIG.sunAzimuth)
    const el = THREE.MathUtils.degToRad(CONFIG.sunElevation)
    return new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize()
  }
  function fitSun() {
    if (!sceneBox) return
    const size = sceneBox.getSize(new THREE.Vector3())
    const center = sceneBox.getCenter(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z)
    sun.target.position.copy(center)
    sun.target.updateMatrixWorld()
    sun.position.copy(center).addScaledVector(sunDir(), radius * 2.5)
    const c = sun.shadow.camera
    const span = radius * 1.1
    c.left = -span; c.right = span; c.top = span; c.bottom = -span
    c.near = 0.1; c.far = radius * 6
    c.updateProjectionMatrix()
    sun.shadow.needsUpdate = true
  }

  // Blue-tinted soft shadow catcher (the Omma look)
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({ opacity: CONFIG.shadowDark, color: new THREE.Color(CONFIG.shadowTint) }),
  )
  shadowCatcher.rotation.x = -Math.PI / 2
  shadowCatcher.receiveShadow = true
  scene.add(shadowCatcher)

  /* ----------------------------------------------------------------------------
   POST-PROCESSING: Render → GTAO → Bloom → Output → SMAA
---------------------------------------------------------------------------- */
  let composer = null, gtaoPass = null, sharpenPass = null, composerOK = false
  try {
    composer = new EffectComposer(renderer)
    composer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.pixelRatio))
    composer.setSize(wrap.clientWidth, wrap.clientHeight)
    composer.addPass(new RenderPass(scene, camera))

    gtaoPass = new GTAOPass(scene, camera, wrap.clientWidth, wrap.clientHeight)
    gtaoPass.output = GTAOPass.OUTPUT.Default
    gtaoPass.blendIntensity = CONFIG.aoBlend
    gtaoPass.updateGtaoMaterial({ radius: CONFIG.aoRadius, distanceExponent: 1, thickness: 1, scale: 1, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
    gtaoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 })
    gtaoPass.enabled = CONFIG.aoOn
    // Ghosted tiles: hide them from the AO pass's internal depth/normal render.
    // The beauty image (already rendered) keeps them visible, but they neither
    // receive nor cast screen-space occlusion while ghosted — no more heavy
    // gray creases on pale tiles.
    const gtaoRenderOrig = gtaoPass.render.bind(gtaoPass)
    gtaoPass.render = (...args) => {
      const hidden = []
      for (const f of Object.values(facilities)) {
        if (f.vis < 0.3 && f.group.visible) { f.group.visible = false; hidden.push(f.group) }
      }
      for (const em of RING_EMITTERS) {
        if (em.root.visible) { em.root.visible = false; hidden.push(em.root) } // FX never occludes
      }
      if (airRoot.visible) { airRoot.visible = false; hidden.push(airRoot) }
      if (flowRoot.visible) { flowRoot.visible = false; hidden.push(flowRoot) }
      for (const L of LABELS) { // nameplates are overlay FX — never AO occluders
        if (L.group.visible) { L.group.visible = false; hidden.push(L.group) }
      }
      gtaoRenderOrig(...args)
      for (const g of hidden) g.visible = true
    }
    composer.addPass(gtaoPass)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(wrap.clientWidth, wrap.clientHeight), CONFIG.bloomStrength, CONFIG.bloomRadius, CONFIG.bloomThreshold)
    bloomPass.enabled = CONFIG.bloomOn
    composer.addPass(bloomPass)

    const bokehPass = new BokehPass(scene, camera, { focus: CONFIG.dofFocus, aperture: CONFIG.dofAperture * 0.001, maxblur: CONFIG.dofMaxblur })
    bokehPass.enabled = CONFIG.dofOn
    composer.addPass(bokehPass)

    sharpenPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(wrap.clientWidth, wrap.clientHeight) },
        amount: { value: CONFIG.sharpenAmount },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 resolution; uniform float amount; varying vec2 vUv;
      void main(){
        vec2 px = 1.0 / resolution;
        vec4 c = texture2D(tDiffuse, vUv);
        vec4 n = texture2D(tDiffuse, vUv + vec2(0.0, px.y));
        vec4 s = texture2D(tDiffuse, vUv - vec2(0.0, px.y));
        vec4 e = texture2D(tDiffuse, vUv + vec2(px.x, 0.0));
        vec4 w = texture2D(tDiffuse, vUv - vec2(px.x, 0.0));
        gl_FragColor = clamp(c * (1.0 + 4.0 * amount) - (n + s + e + w) * amount, 0.0, 1e5);
      }`,
    })
    sharpenPass.enabled = CONFIG.sharpenOn
    composer.addPass(sharpenPass)

    const chromaticPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, amount: { value: CONFIG.chromaticAmount } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
      uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv;
      void main(){
        vec2 dir = vUv - 0.5;
        vec2 offset = normalize(dir) * length(dir) * amount;
        gl_FragColor = vec4(
          texture2D(tDiffuse, vUv - offset).r,
          texture2D(tDiffuse, vUv).g,
          texture2D(tDiffuse, vUv + offset).b, 1.0);
      }`,
    })
    chromaticPass.enabled = CONFIG.chromaticOn
    composer.addPass(chromaticPass)

    const vignettePass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, amount: { value: CONFIG.vignetteAmount } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
      uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv;
      void main(){
        vec4 col = texture2D(tDiffuse, vUv);
        vec2 uv = vUv - 0.5;
        float vig = smoothstep(0.8, 0.2, length(uv) * amount * 1.6 + (1.0 - amount));
        col.rgb *= mix(1.0, vig, amount);
        gl_FragColor = col;
      }`,
    })
    vignettePass.enabled = CONFIG.vignetteOn
    composer.addPass(vignettePass)

    composer.addPass(new OutputPass())

    const smaaPass = new SMAAPass(wrap.clientWidth, wrap.clientHeight)
    smaaPass.enabled = CONFIG.smaaOn
    composer.addPass(smaaPass)

    composerOK = true
  }
  catch (err) {
    console.error('Post-processing unavailable, falling back to direct render:', err)
  }

  /* ----------------------------------------------------------------------------
   CAMERA RIG — the Spline feel.
   Spherical orbit around a target. Mouse position sets a small azimuth /
   elevation offset which the camera chases with exponential damping.
   Drag adds a persistent offset; wheel (optional) zooms. All damped.
---------------------------------------------------------------------------- */
  const rig = {
    target: new THREE.Vector3(), // damped look-at point
    targetGoal: new THREE.Vector3(), // where the target wants to be
    dist: 100,
    az: 0, el: 0, // current damped angles (rad)
    azGoalBase: 0, elGoalBase: 0, // base view (rad)
    swayAz: 0, swayEl: 0, // damped mouse sway (rad)
    swayAzGoal: 0, swayElGoal: 0,
    dragAz: 0, dragEl: 0, // persistent drag offset (rad)
    zoom: 0.82, zoomGoal: 1.0, // start slightly wide → eases in (intro)
    frustumFit: 20,
    nudgeX: CONFIG.frameX, nudgeY: CONFIG.frameY, // damped screen nudge (px)
  }

  function rigApplyBase() {
    rig.azGoalBase = THREE.MathUtils.degToRad(CONFIG.baseAz)
    rig.elGoalBase = THREE.MathUtils.degToRad(CONFIG.baseEl)
  }
  rigApplyBase()
  // Intro offset — camera glides into the base view on load
  rig.az = rig.azGoalBase - THREE.MathUtils.degToRad(16)
  rig.el = rig.elGoalBase + THREE.MathUtils.degToRad(9)

  const pointer = { x: 0, y: 0, inside: false, dragging: false, lastX: 0, lastY: 0, moved: false }
  const raycastPointer = new THREE.Vector2(-10, -10)

  on(window, 'pointermove', (e) => {
    const r = wrap.getBoundingClientRect()
    // Sway is driven by the pointer across the whole window width for a broad,
    // lazy feel (like the Spline embed), vertical relative to the viewer area.
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1
    pointer.inside = e.clientY >= r.top - 200 && e.clientY <= r.bottom + 200
    raycastPointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    hoverChip.style.left = e.clientX + 'px'
    hoverChip.style.top = e.clientY + 'px'

    if (pointer.dragging) {
      const dx = e.clientX - pointer.lastX
      const dy = e.clientY - pointer.lastY
      pointer.lastX = e.clientX; pointer.lastY = e.clientY
      rig.dragAz -= THREE.MathUtils.degToRad(dx * 0.14)
      rig.dragEl += THREE.MathUtils.degToRad(dy * 0.09)
      rig.dragAz = THREE.MathUtils.clamp(rig.dragAz, THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(30))
      rig.dragEl = THREE.MathUtils.clamp(rig.dragEl, THREE.MathUtils.degToRad(-16), THREE.MathUtils.degToRad(16))
      pointer.moved = true
    }
  })
  canvas.addEventListener('pointerdown', (e) => {
    pointer.downX = e.clientX; pointer.downY = e.clientY; pointer.downOnCanvas = true
    viewerHint.classList.add('faded')
    if (!CONFIG.dragOn) return
    pointer.dragging = true; pointer.moved = false
    pointer.lastX = e.clientX; pointer.lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  })
  on(window, 'pointerup', (e) => {
    pointer.dragging = false
    if (!pointer.downOnCanvas) return
    pointer.downOnCanvas = false
    // A "click" is a press that barely moved — otherwise it was an orbit drag
    if (Math.hypot(e.clientX - pointer.downX, e.clientY - pointer.downY) > 6) return
    handleSceneClick(e)
  })
  on(window, 'pointerleave', () => { pointer.inside = false })
  on(document, 'mouseleave', () => { pointer.inside = false })

  canvas.addEventListener('wheel', (e) => {
    if (!CONFIG.wheelZoom) return
    e.preventDefault()
    rig.zoomGoal = THREE.MathUtils.clamp(rig.zoomGoal * Math.exp(-e.deltaY * 0.0012), 0.55, 2.4)
  }, { passive: false })

  on(window, 'keydown', (e) => {
    if (e.key !== 'Escape') return
    cancelTour('esc')
    clearFlowSelect()
    hideCallout()
    hidePartPanel()
    if (focusedKey) resetFocus()
  })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // The canvas reaches up behind the header so tiles bleed through, but the
  // composition must sit exactly where the old below-header layout put it.
  // headerPx = height of the header zone; the projection window shifts up by
  // half of it, which renders the scene that much lower on the canvas.
  let headerPx = 0
  const effHeaderPx = () => Math.min(headerPx, wrap.clientHeight * CONFIG.headerMaxFrac)
  function measureHeader() {
    const tabsEl = $id('tabs')
    if (!tabsEl) return
    headerPx = Math.max(0, tabsEl.getBoundingClientRect().bottom - wrap.getBoundingClientRect().top + 10)
  }
  measureHeader()

  // Pixel-dialed offsets (framing nudges, panel position, header band) were
  // tuned on a large monitor. Scale them against a reference viewport so a
  // laptop window keeps the same PROPORTIONS instead of the same raw pixels.
  const REF_W = 1920, REF_H = 1080
  const refSX = () => wrap.clientWidth / REF_W
  const refSY = () => wrap.clientHeight / REF_H

  function updateRig(dt, t) {
  // Mouse sway goals (ease back to center when the pointer leaves)
    const sx = CONFIG.invertX ? -1 : 1
    const sy = CONFIG.invertY ? -1 : 1
    if (reducedMotion) {
      rig.swayAzGoal = 0; rig.swayElGoal = 0
    }
    else if (pointer.inside && !pointer.dragging) {
      rig.swayAzGoal = -pointer.x * THREE.MathUtils.degToRad(CONFIG.swayX) * sx
      rig.swayElGoal = -pointer.y * THREE.MathUtils.degToRad(CONFIG.swayY) * sy
    }
    else if (!pointer.dragging) {
    // gentle idle drift when no pointer (touch devices / mouse off-window)
      rig.swayAzGoal = Math.sin(t * 0.22) * THREE.MathUtils.degToRad(2.0)
      rig.swayElGoal = Math.sin(t * 0.15) * THREE.MathUtils.degToRad(0.8)
    }

    const k = CONFIG.damping
    rig.swayAz = THREE.MathUtils.damp(rig.swayAz, rig.swayAzGoal, k, dt)
    rig.swayEl = THREE.MathUtils.damp(rig.swayEl, rig.swayElGoal, k, dt)
    rig.az = THREE.MathUtils.damp(rig.az, rig.azGoalBase + rig.dragAz, k, dt)
    rig.el = THREE.MathUtils.damp(rig.el, rig.elGoalBase + rig.dragEl, k, dt)
    rig.zoom = THREE.MathUtils.damp(rig.zoom, rig.zoomGoal, 2.6, dt)
    rig.target.x = THREE.MathUtils.damp(rig.target.x, rig.targetGoal.x, 2.6, dt)
    rig.target.y = THREE.MathUtils.damp(rig.target.y, rig.targetGoal.y, 2.6, dt)
    rig.target.z = THREE.MathUtils.damp(rig.target.z, rig.targetGoal.z, 2.6, dt)

    // Zoomed in, the same angular sway reads much bigger on screen — scale it down
    const ss = 1 / Math.max(1, rig.zoom)
    const az = rig.az + rig.swayAz * ss
    const el = THREE.MathUtils.clamp(rig.el + rig.swayEl * ss, 0.06, 1.45)
    camera.position.set(
      rig.target.x + Math.cos(el) * Math.sin(az) * rig.dist,
      rig.target.y + Math.sin(el) * rig.dist,
      rig.target.z + Math.cos(el) * Math.cos(az) * rig.dist,
    )
    camera.lookAt(rig.target)

    const aspect = wrap.clientWidth / wrap.clientHeight
    // Short windows (laptops) leave the height-limited fit looking small — boost
    // the zoom by up to fitBoost × the height deficit vs a 1000px-tall canvas.
    const hDeficit = Math.min(Math.max(1200 / Math.max(1, wrap.clientHeight) - 1, 0), 1)
    const f = rig.frustumFit / (rig.zoom * (1 + CONFIG.fitBoost * hDeficit))
    const dyW = effHeaderPx() * f / wrap.clientHeight // shift view window up (capped reserve)
    // Screen-space framing nudge (px → world units). Home view, tab views, and
    // focused close-ups each get their own offset, eased between on transitions.
    const nGoalX = focusedKey ? CONFIG.frameXFocus : (activePathway ? CONFIG.frameXTab : CONFIG.frameX)
    const nGoalY = focusedKey ? CONFIG.frameYFocus : (activePathway ? CONFIG.frameYTab : CONFIG.frameY)
    rig.nudgeX = THREE.MathUtils.damp(rig.nudgeX, nGoalX, 2.6, dt)
    rig.nudgeY = THREE.MathUtils.damp(rig.nudgeY, nGoalY, 2.6, dt)
    const nx = -(rig.nudgeX * refSX()) * (2 * f * aspect) / wrap.clientWidth
    const ny = -(rig.nudgeY * refSY()) * (2 * f) / wrap.clientHeight
    camera.left = -f * aspect + nx; camera.right = f * aspect + nx
    camera.top = f + dyW + ny; camera.bottom = -f + dyW + ny
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld() // keeps same-frame screen projections accurate
  }

  // Compute the frustum size needed to frame a box from the current base angles.
  // aimY (optional) lowers/raises the look-at point; extents are measured around
  // it so the subject shifts in frame without clipping.
  function fitFrustum(box, pad = 1.08, aimY) {
    const az = rig.azGoalBase, el = rig.elGoalBase
    const center = box.getCenter(new THREE.Vector3())
    if (aimY !== undefined) center.y = aimY
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az))
    const camPos = center.clone().addScaledVector(dir, rig.dist)
    const m = new THREE.Matrix4().lookAt(camPos, center, new THREE.Vector3(0, 1, 0)).invert()
    let maxX = 0, maxY = 0
    const corners = []
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z))
    const aspect = wrap.clientWidth / wrap.clientHeight
    corners.forEach((c) => {
      const v = c.clone().sub(camPos).applyMatrix4(m)
      maxX = Math.max(maxX, Math.abs(v.x))
      maxY = Math.max(maxY, Math.abs(v.y))
    })
    // vertical fits use only the region below the header
    const hComp = wrap.clientHeight / Math.max(1, wrap.clientHeight - effHeaderPx())
    return Math.max(maxY * hComp, maxX / aspect) * pad
  }

  /* ----------------------------------------------------------------------------
   MODEL LOADING
---------------------------------------------------------------------------- */
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(opts.dracoPath)
  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  const facilities = {} // key -> { group, label, baseY, vis, visGoal, lift, liftGoal, hover, hoverGoal, mats:[], center }
  const connections = {} // lowercase name -> { group, fade, goal, mats:[] }
  const hoverMeshes = [] // meshes eligible for hover raycast (mesh.userData.facilityKey set)

  const MODEL_URL = opts.modelUrl

  gltfLoader.load(
    MODEL_URL,
    (gltf) => { if (!disposed) setupModel(gltf.scene) },
    (xhr) => {
      if (disposed) return
      if (xhr.total) setLoaderProgress((xhr.loaded / xhr.total) * 0.92) // real download %, last 8% = scene build
      else setLoaderProgress(Math.min(xhr.loaded / 14650000, 1) * 0.92)
    },
    (err) => {
      if (disposed) return
      console.error('Model load failed:', err)
      loaderText.textContent = 'Could not load the ecosystem model — see console.'
    },
  )

  function findFacilityKey(name) {
    for (const [key, def] of Object.entries(FACILITY_DEFS)) if (def.match.test(name)) return key
    return null
  }

  function setupModel(root) {
    scene.add(root)

    // The export nests everything under a single "Ecosystem" node
    const eco = root.getObjectByName('Ecosystem') || root

    eco.children.forEach((child) => {
      const name = child.name || ''
      if (/^connections$/i.test(name)) {
        child.children.forEach((conn) => {
          const key = (conn.name || '').trim().toLowerCase()
          const mats = collectClonedMaterials(conn)
          mats.forEach((m) => {
            m.userData.baseOpacity = m.opacity ?? 1
            m.transparent = true; m.opacity = 0; m.depthWrite = false
          })
          conn.visible = false
          connections[key] = { group: conn, fade: 0, goal: 0, mats }
        })
        return
      }
      const key = findFacilityKey(name)
      if (!key) { prepShadows(child); return }
      const mats = collectClonedMaterials(child)
      const fadeUniform = { value: 0 }
      mats.forEach((m) => {
        m.userData.baseColor = m.color ? m.color.clone() : null
        m.userData.baseOpacity = m.opacity ?? 1
        m.userData.baseTransparent = !!m.transparent
        m.userData.baseDepthWrite = m.depthWrite
        patchGhost(m, fadeUniform)
      })
      prepShadows(child)
      const box = new THREE.Box3().setFromObject(child)
      facilities[key] = {
        group: child, label: FACILITY_DEFS[key].label,
        baseY: child.position.y,
        vis: 1, visGoal: 1, lift: 0, liftGoal: 0, hover: 0, hoverGoal: 0,
        castOn: true, // shadow casting follows the ghost fade
        fadeUniform, // drives the shader ghost mix for every material in this tile
        mats, center: box.getCenter(new THREE.Vector3()),
        box0: box.clone(), // pre-FX bounds (rings would inflate a live measure)
      }
      child.traverse((o) => { if (o.isMesh) { o.userData.facilityKey = key; hoverMeshes.push(o) } })
    })

    // Frame the whole ecosystem
    sceneBox = new THREE.Box3().setFromObject(root)
    const size = sceneBox.getSize(new THREE.Vector3())
    const center = sceneBox.getCenter(new THREE.Vector3())
    rig.dist = Math.max(size.x, size.y, size.z) * 3
    camera.near = 1
    camera.far = rig.dist * 4 // tight depth range = better GTAO/shadow precision
    rig.targetGoal.set(center.x, sceneBox.min.y + size.y * CONFIG.targetY, center.z)
    rig.target.copy(rig.targetGoal)
    rig.frustumFit = fitFrustum(sceneBox)
    rig.zoomGoal = CONFIG.zoom

    shadowCatcher.scale.set(size.x * 8, size.z * 8, 1)
    shadowCatcher.position.set(center.x, sceneBox.min.y - 0.02, center.z)
    fitSun()
    registerFlag(root)
    classifyOverrides(eco)
    applyPipes(); applyEarth(); applyWellheads() // honors a locked look loaded pre-model
    setupDacMetal()
    // setupFacilityParts(...) — retired here; the per-facility pages own this layer
    applyDacMetalProps() // honors a locked look loaded pre-model
    setupWater()
    placeRings()
    setupFans()
    buildAirLines()
    buildFlowLines()
    setupLabels()

    setLoaderProgress(1, 'Ready')
    later(() => hostEl.classList.remove('booting'), 250) // header fades up after the loader clears
    loaderEl.style.opacity = '0'
    later(() => { loaderEl.style.display = 'none' }, 500)
    later(() => viewerHint.classList.add('faded'), 4500)
    console.log('[explorer] facilities:', Object.keys(facilities).join(', '))
    console.log('[explorer] connections:', Object.keys(connections).join(' | '))
  }

  function prepShadows(obj) {
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          if (!m) return
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
          if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace
          if ('envMapIntensity' in m) m.envMapIntensity = CONFIG.matEnv
        })
      }
    })
  }

  // Clone materials so each facility/connection owns its own copies (the GLB
  // shares materials across groups — cloning lets us dim one group at a time).
  function collectClonedMaterials(group) {
    const cloneMap = new Map()
    const result = []
    group.traverse((o) => {
      if (!o.isMesh) return
      const src = o.material
      const clone1 = (m) => {
        if (!cloneMap.has(m.uuid)) { const c = m.clone(); cloneMap.set(m.uuid, c); result.push(c) }
        return cloneMap.get(m.uuid)
      }
      o.material = Array.isArray(src) ? src.map(clone1) : clone1(src)
    })
    return result
  }

  /* ----------------------------------------------------------------------------
   FLAG WIND (ported from the Omma build — the rig's American flag ripples)
---------------------------------------------------------------------------- */
  let flagMesh = null
  function registerFlag(root) {
    root.traverse((child) => {
      if (child.isMesh && /american[\s_]*flag/i.test(child.name || '')) {
        flagMesh = child
        const geo = child.geometry
        if (!geo.attributes.normal) geo.computeVertexNormals()
        const rest = new Float32Array(geo.attributes.position.array.length)
        rest.set(geo.attributes.position.array)
        geo.userData._rest = rest
        geo.computeBoundingBox()
        const bb = geo.boundingBox
        const d = { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y, z: bb.max.z - bb.min.z }
        // the flag's LENGTH is its largest local dimension (this mesh: local Y)
        const axis = d.x >= d.y && d.x >= d.z ? 'x' : d.y >= d.z ? 'y' : 'z'
        geo.userData._axis = axis
        geo.userData._minA = bb.min[axis]
        geo.userData._spanA = d[axis] || 1
      }
    })
  }
  function noise3(x, y, z) {
    return (Math.sin(x * 1.7 + y * 0.9) + Math.sin(y * 2.3 - z * 1.1) + Math.sin(z * 1.9 + x * 1.3)) / 3
  }
  function updateFlag(t) {
    if (!flagMesh) return
    const geo = flagMesh.geometry
    const rest = geo.userData._rest
    if (!rest) return
    const pos = geo.attributes.position, nrm = geo.attributes.normal, arr = pos.array
    const axis = geo.userData._axis, minA = geo.userData._minA, spanA = geo.userData._spanA
    const time = t * CONFIG.flagSpeed
    for (let i = 0; i < arr.length; i += 3) {
      const rx = rest[i], ry = rest[i + 1], rz = rest[i + 2]
      const a = axis === 'x' ? rx : axis === 'y' ? ry : rz // along the flag
      const c1 = axis === 'x' ? rz : rx // across the flag
      const c2 = axis === 'y' ? rz : ry
      let along = (a - minA) / spanA
      if (CONFIG.flagFlip) along = 1 - along // swap pinned end
      const w = Math.pow(along, 1.35)
      const wave = Math.sin(along * 5.5 - time * 2.0) * 0.6 + Math.sin(along * 10.4 - time * 3.1) * 0.25
      const turb = noise3(along * 4.0, c1 * 3.0 + time, c2 * 3.0 - time * 0.7)
      const disp = (wave + turb * 0.55) * CONFIG.flagAmp * w
      arr[i] = rx + nrm.getX(i / 3) * disp
      arr[i + 1] = ry + nrm.getY(i / 3) * disp
      arr[i + 2] = rz + nrm.getZ(i / 3) * disp
    }
    pos.needsUpdate = true
  }

  /* ----------------------------------------------------------------------------
   PATHWAY HIGHLIGHT ENGINE
---------------------------------------------------------------------------- */
  let activePathway = null // key into PATHWAYS or null (= everything shown)
  let focusedKey = null // facility currently zoomed in on (click-to-focus)

  /* Ghosting works by mixing each pixel toward a pale tint INSIDE the shader —
   fully opaque, so dense geometry (fan walls, manifolds, towers) can't
   alpha-stack back to solid the way per-material transparency does. */
  const GHOST_COLOR = new THREE.Color('#e7eaef') // recomputed from Desaturate slider
  function updateGhostColor() {
    GHOST_COLOR.lerpColors(new THREE.Color('#c6ccd8'), new THREE.Color('#edeff3'), CONFIG.dimDesat)
  }
  updateGhostColor()

  // Adjustment-layer uniforms: neutral for most materials; the DAC metal set
  // shares a live object driven from the settings panel.
  const ADJ_NEUTRAL = { uAdjExp: { value: 0 }, uAdjBright: { value: 1 }, uAdjGamma: { value: 1 } }
  const dacAdj = { uAdjExp: { value: 0 }, uAdjBright: { value: 1 }, uAdjGamma: { value: 1 } }

  function patchGhost(m, fadeUniform, adj = ADJ_NEUTRAL) {
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uGhostFade = fadeUniform // shared per facility
      shader.uniforms.uGhostColor = { value: GHOST_COLOR } // shared globally
      shader.uniforms.uAdjExp = adj.uAdjExp // adjustment layer
      shader.uniforms.uAdjBright = adj.uAdjBright
      shader.uniforms.uAdjGamma = adj.uAdjGamma
      const inject
        = 'gl_FragColor.rgb = pow(max(gl_FragColor.rgb * uAdjBright * exp2(uAdjExp), vec3(0.0)), vec3(uAdjGamma));\n'
          + 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uGhostColor, uGhostFade);\n'
      if (shader.fragmentShader.includes('#include <dithering_fragment>')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          inject + '#include <dithering_fragment>',
        )
      }
      else {
        shader.fragmentShader = shader.fragmentShader.replace(/}\s*$/, inject + '}')
      }
      shader.fragmentShader = 'uniform float uGhostFade;\nuniform vec3 uGhostColor;\nuniform float uAdjExp;\nuniform float uAdjBright;\nuniform float uAdjGamma;\n' + shader.fragmentShader
      m.userData.shader = shader
    }
    m.needsUpdate = true
  }

  function setPathway(key) {
    cancelTour('pathway')
    clearFlowSelect()
    hidePartPanel()
    if (hotspotActive) { hotspotActive = false; hotspotKey = null; rigApplyBase() }
    activePathway = key
    focusedKey = null
    refreshFlowColors()
    const pw = key ? PATHWAYS[key] : null

    for (const [fk, f] of Object.entries(facilities)) {
      const on = !pw || pw.facilities.includes(fk)
      f.visGoal = on ? 1 : 0
      f.liftGoal = pw && on ? 1 : 0
    }
    for (const [ck, c] of Object.entries(connections)) {
      c.goal = pw && pw.connections.includes(ck) ? 1 : 0
    }

    // Info panel + camera focus
    cardHide(facilityPanel)
    infoPanel.classList.remove('recede', 'no-pathway', 'focused')
    infoChips.querySelectorAll('.info-chip').forEach(c => c.classList.remove('on'))
    if (pw) {
      panelShowPathway(pw)
      if (CONFIG.focusCam && sceneBox) {
        const pts = pw.facilities.map(fk => facilities[fk]?.center).filter(Boolean)
        if (pts.length) {
          const c = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / pts.length)
          const size = sceneBox.getSize(new THREE.Vector3())
          rig.targetGoal.set(c.x, sceneBox.min.y + size.y * CONFIG.targetY, c.z)
          rig.zoomGoal = CONFIG.zoom * 1.16
        }
      }
    }
    else {
      cardHide(infoPanel)
      if (sceneBox) {
        const size = sceneBox.getSize(new THREE.Vector3())
        const center = sceneBox.getCenter(new THREE.Vector3())
        rig.targetGoal.set(center.x, sceneBox.min.y + size.y * CONFIG.targetY, center.z)
        rig.zoomGoal = CONFIG.zoom
      }
    }
    renderCrumbs()
  }

  function updateHighlight(dt) {
  // Spotlight ghosting eases slower so the fade reads clearly
    const k = focusedKey ? Math.min(CONFIG.hlSpeed, 2.2) : CONFIG.hlSpeed
    for (const f of Object.values(facilities)) {
      const prevVis = f.vis, prevLift = f.lift, prevHover = f.hover
      f.vis = THREE.MathUtils.damp(f.vis, f.visGoal, k, dt)
      f.lift = THREE.MathUtils.damp(f.lift, f.liftGoal, k, dt)
      f.hover = THREE.MathUtils.damp(f.hover, f.hoverGoal, 6, dt)

      if (Math.abs(f.lift - prevLift) > 1e-4 || Math.abs(f.hover - prevHover) > 1e-4) {
        f.group.position.y = f.baseY + f.lift * CONFIG.activeLift + f.hover * CONFIG.hoverLift
      }
      if (Math.abs(f.vis - prevVis) > 1e-4) {
        const v = f.vis
        // Opaque shader mix toward GHOST_COLOR — dimOpacity sets how much of the
        // original detail survives (0.14 = 14% visible, like before).
        f.fadeUniform.value = (1 - v) * (1 - CONFIG.dimOpacity)
        // Shadow maps ignore the ghost mix — a ghosted tile would still cast a
        // full shadow. Drop it late in the fade so the pop is barely visible.
        const wantCast = v > 0.3
        if (f.castOn !== wantCast) {
          f.castOn = wantCast
          f.group.traverse((o) => { if (o.isMesh && !o.userData.isFxRing) o.castShadow = wantCast && CONFIG.shadowOn })
        }
      }
    }
    for (const c of Object.values(connections)) {
      if (Math.abs(c.fade - c.goal) < 1e-4) { continue }
      c.fade = THREE.MathUtils.damp(c.fade, c.goal, k, dt)
      c.group.visible = c.fade > 0.005
      c.mats.forEach((m) => { m.opacity = m.userData.baseOpacity * c.fade })
    }
  }

  /* ----------------------------------------------------------------------------
   HOVER (raycast → lift + label chip)
---------------------------------------------------------------------------- */
  const raycaster = new THREE.Raycaster()
  let hoveredKey = null
  let rayTick = 0

  // Where is part-highlighting live right now?
  // DAC: only inside its hotspot close-up. EOR: in the regular focus view (its
  // blue dot is retired — the tile itself is the interactive layer).
  function partContext() {
    return null // equipment interaction moved to the per-facility pages
  }

  function updateHover() {
    rayTick = (rayTick + 1) % 3 // every 3rd frame is plenty
    if (rayTick !== 0 || !hoverMeshes.length) return
    const canRay = pointer.inside && !pointer.dragging
      && raycastPointer.x >= -1 && raycastPointer.x <= 1 && raycastPointer.y >= -1 && raycastPointer.y <= 1
    // Part hover — active in the DAC close-up AND in the plain EOR focus view.
    const ctx = partContext()
    let hitPart = null
    if (ctx && canRay && dacPartMeshes.length) {
      raycaster.setFromCamera(raycastPointer, camera)
      const hits = raycaster.intersectObjects(dacPartMeshes, false)
      const h = hits.find(x => x.object.userData.partFk === ctx)
      if (h) hitPart = h.object.userData.dacPart || null
    }
    if (hitPart !== hoveredPart) {
      hoveredPart = hitPart
      for (const p of DAC_PARTS) p.goal = p.key === hitPart ? 1 : 0
    }
    if (hitPart) { // a glowing part owns the cursor; tile hover stands down
      if (hoveredKey) {
        if (facilities[hoveredKey]) facilities[hoveredKey].hoverGoal = 0
        hoveredKey = null
        hoverChip.classList.remove('on')
      }
      canvas.style.cursor = 'pointer'
      return
    }
    // Hotspot close-up: tile hover retires entirely.
    if (hotspotActive) {
      if (hoveredKey) {
        if (facilities[hoveredKey]) facilities[hoveredKey].hoverGoal = 0
        hoveredKey = null
        hoverChip.classList.remove('on')
      }
      canvas.style.cursor = CONFIG.dragOn ? 'grab' : 'default'
      return
    }
    // Flow-line hover — nearest-hit wins against tiles; the route swells.
    const hadFlow = hoveredFlow
    let hitFlow = null
    if (!focusedKey && CONFIG.flowOn && canRay && flowPickMeshes.length) {
      raycaster.setFromCamera(raycastPointer, camera)
      const fh = raycaster.intersectObjects(flowPickMeshes, false).filter(h => h.object.visible)
      if (fh.length) {
        const th = raycaster.intersectObjects(hoverMeshes, false)
        if (!th.length || fh[0].distance < th[0].distance) hitFlow = fh[0].object.userData.flowRec
      }
    }
    hoveredFlow = hitFlow
    if (hitFlow) {
      if (hoveredKey) {
        if (facilities[hoveredKey]) facilities[hoveredKey].hoverGoal = 0
        hoveredKey = null
        hoverChip.classList.remove('on')
      }
      canvas.style.cursor = 'pointer'
      return
    }
    if (hadFlow && !hoveredKey) canvas.style.cursor = CONFIG.dragOn ? 'grab' : 'default'
    let hitKey = null
    if (canRay) {
      raycaster.setFromCamera(raycastPointer, camera)
      const hits = raycaster.intersectObjects(hoverMeshes, false)
      if (hits.length) {
        const key = hits[0].object.userData.facilityKey
        if (key && facilities[key]) hitKey = key // ghosted tiles are hop targets too
      }
    }
    if (hitKey !== hoveredKey) {
      if (hoveredKey && facilities[hoveredKey]) facilities[hoveredKey].hoverGoal = 0
      hoveredKey = hitKey
      if (hitKey) {
      // lift only tiles that are actually visible; ghosts just get chip+cursor
        facilities[hitKey].hoverGoal = (hitKey === focusedKey || facilities[hitKey].visGoal <= 0.5) ? 0 : 1
        if (!CONFIG.lblOn) { // 3D nameplates replace the floating chip
          hoverChip.textContent = facilities[hitKey].label
          hoverChip.classList.add('on')
        }
        canvas.style.cursor = 'pointer'
      }
      else {
        hoverChip.classList.remove('on')
        canvas.style.cursor = CONFIG.dragOn ? 'grab' : 'default'
      }
    }
  }

  /* ----------------------------------------------------------------------------
   CLICK-TO-FOCUS — click a facility: camera eases in and frames it.
   Click it again (or empty space, Esc, or the ⟲ button): eases back out.
---------------------------------------------------------------------------- */
  function focusFacility(key, keepHotspotAngles) {
    const f = facilities[key]
    if (!f || !sceneBox) return
    if (hotspotActive && !keepHotspotAngles) { hotspotActive = false; hotspotKey = null; rigApplyBase() }
    clearFlowSelect()
    hidePartPanel()
    // Family check: clicking a facility OUTSIDE the active pathway (e.g. Lithium
    // while on Oil and Gas) sheds the pathway context — tab deactivates and the
    // panel presents the facility on its own terms (plain Level 3).
    if (activePathway && PATHWAYS[activePathway] && !PATHWAYS[activePathway].facilities.includes(key)) {
      activePathway = null
      tabButtons.forEach(btn => btn.classList.remove('active'))
      refreshFlowColors() // overview cargo colors resume once focus exits
    }
    focusedKey = key
    // Spotlight: every other tile ghosts back while this one is focused.
    // resetFocus() → setPathway() restores the pathway/overview state.
    for (const [fk, f2] of Object.entries(facilities)) {
      f2.visGoal = fk === key ? 1 : 0
      f2.liftGoal = 0
    }
    // cached pre-FX bounds, shifted by any current lift
    const box = f.box0.clone().translate(new THREE.Vector3(0, f.group.position.y - f.baseY, 0))
    const center = box.getCenter(new THREE.Vector3())
    // Aim below the box center — tall structures (derrick, towers) pull the
    // center up and leave the tile sitting low in frame otherwise.
    const def = FACILITY_DEFS[key] || {}
    const hFrac = def.focusHeight !== undefined ? def.focusHeight : CONFIG.focusHeight
    const pad = CONFIG.focusPad * (def.focusPadMul || 1)
    const aimY = box.min.y + (box.max.y - box.min.y) * hFrac
    rig.targetGoal.set(center.x, aimY, center.z)
    const needed = fitFrustum(box, pad, aimY)
    rig.zoomGoal = THREE.MathUtils.clamp(rig.frustumFit / needed, 0.55, 4.5)
    panelShowFacility(key)
    renderCrumbs()
  }

  /* ----------------------------------------------------------------------------
   INFO PANEL — one panel, two modes: pathway (tab) and facility (click-focus)
---------------------------------------------------------------------------- */
  function panelShowPathway(pw) {
    infoTag.textContent = pw.tag || 'Integration' // per-tab category (see PATHWAYS)
    infoTitle.textContent = pw.title
    infoDesc.textContent = pw.desc
    infoChips.innerHTML = '';
    (pw.chips || []).forEach(([key, label]) => {
      const chip = document.createElement('span')
      chip.className = 'info-chip'
      chip.dataset.key = key
      chip.appendChild(document.createTextNode(label)) // dots retired — chips are text-only
      // chips talk to the scene: hover lifts the facility, click focuses it
      chip.addEventListener('mouseenter', () => { if (facilities[key]) facilities[key].hoverGoal = 1 })
      chip.addEventListener('mouseleave', () => { if (facilities[key] && hoveredKey !== key) facilities[key].hoverGoal = 0 })
      chip.addEventListener('click', () => focusFacility(key))
      infoChips.appendChild(chip)
    })
    infoLink.setAttribute('href', (pw.link && pw.link.href) || '#')
    infoLinkText.textContent = (pw.link && pw.link.label) || 'Explore'
    infoPanel.classList.remove('recede')
    cardShow(infoPanel)
  }

  // Facility card eases in ABOVE the integration panel, which stays put
  // (slightly receded) so the user keeps their orientation. When hopping from
  // one facility to another, the card eases out left and back in from the right.
  function panelShowFacility(key) {
    const def = FACILITY_DEFS[key]
    if (!def) return
    infoTag.textContent = def.cat || 'Integration' // Core Business / Low Carbon Ventures
    infoPanel.classList.add('focused') // Level 3: reveals the explore button above the crumbs
    const fill = () => {
      facTitle.textContent = def.label
      facDesc.textContent = def.desc || ''
    }
    // The facility card now lives INSIDE the main panel — make sure the shell
    // is up first. Focused straight from the overview there's no pathway copy,
    // so the shell collapses to crumbs + facility card (.no-pathway).
    infoPanel.classList.toggle('no-pathway', !activePathway)
    if (infoPanel.style.display !== 'block' || infoPanel.classList.contains('hide')) cardShow(infoPanel)
    const visible = facilityPanel.style.display === 'block' && !facilityPanel.classList.contains('hide')
    if (visible && facTitle.textContent !== def.label) {
    // tile-to-tile hop: out to the left, swap, in from the right (~100px)
      clearTimeout(facilityPanel._hopT)
      facilityPanel.style.transition = 'opacity .2s ease, transform .2s ease'
      facilityPanel.style.opacity = '0'
      facilityPanel.style.transform = 'translateX(-70px)'
      facilityPanel._hopT = setTimeout(() => {
        fill()
        facilityPanel.style.transition = 'none'
        facilityPanel.style.transform = 'translateX(100px)'
        requestAnimationFrame(() => requestAnimationFrame(() => {
          facilityPanel.style.transition = 'opacity .32s ease, transform .32s cubic-bezier(0.22, 0.9, 0.35, 1)'
          facilityPanel.style.opacity = '1'
          facilityPanel.style.transform = 'translateX(0)'
          facilityPanel._hopT = setTimeout(() => cardClearInline(facilityPanel), 360)
        }))
      }, 200)
    }
    else {
      fill()
      cardShow(facilityPanel)
    }
    if (activePathway) {
      infoChips.querySelectorAll('.info-chip').forEach(c => c.classList.toggle('on', c.dataset.key === key))
    }
  }

  function resetFocus() {
    focusedKey = null
    if (hotspotActive) { hotspotActive = false; hotspotKey = null; rigApplyBase() } // restore camera angles
    setPathway(activePathway) // restores overview / pathway framing + info panel
  }

  /* ----------------------------------------------------------------------------
   DAC HOTSPOT — pulsing dot anchored to the tile; click = 30% closer from an
   alternate orientation. Click away / Esc returns to the wide view.
---------------------------------------------------------------------------- */
  let hotspotActive = false
  // eslint-disable-next-line no-unused-vars -- read by the retired close-up tuning controls; kept for parity
  let hotspotKey = null // which facility's close-up we're inside
  const dacHotspot = $id('dacHotspot')
  const hsWorld = new THREE.Vector3()

  // One dot per facility, all sharing the DAC dot's look. DAC keeps its original
  // CONFIG names so existing locked looks stay valid; the others map to flat keys.
  // PIVOT (per review): ALL dots retired — equipment-level depth now lives on
  // the standalone per-facility pages. Registry left empty; machinery dormant.
  const HOTSPOT_DEFS = []
  HOTSPOT_DEFS.forEach((h) => {
    if (h.key === 'dac') h.el = dacHotspot
    else {
      const d = document.createElement('div')
      d.className = 'hotspot'
      d.style.display = 'none'
      d.title = 'Take a closer look'
      d.innerHTML = '<span class="hs-ring"></span><span class="hs-ring hs-ring2"></span><span class="hs-core"></span>'
      dacHotspot.parentElement.appendChild(d)
      h.el = d
    }
    if (h.key === 'sequestration') h.el.title = 'What happens down here?'
    h.el.addEventListener('click', (e) => {
      e.stopPropagation()
      if (h.key === 'sequestration') {
      // info dot: no camera dive — just the underground story, anchored at the
      // dot's true WORLD position (hsWorld can't be reused here: updateHotspot
      // overwrites it with projected screen coordinates every frame)
        showPartPanel(hotspotWorldOf(h, new THREE.Vector3()), SEQ_DOT_COPY.title, SEQ_DOT_COPY.body)
        return
      }
      enterHotspot(h.key)
    })
    h.el.addEventListener('pointerdown', e => e.stopPropagation())
  })

  // The dot's anchor in world space (center + dialed offsets + current lift).
  function hotspotWorldOf(h, out) {
    const f = facilities[h.key]
    if (!f) return out.set(0, 0, 0)
    out.copy(f.center)
    out.x += CONFIG[h.cfg.offX]
    out.y += CONFIG[h.cfg.offY] + (f.group.position.y - f.baseY)
    out.z += CONFIG[h.cfg.offZ]
    return out
  }

  function enterHotspot(key) {
    const h = HOTSPOT_DEFS.find(x => x.key === key)
    if (!h) return
    cancelTour('hotspot')
    hotspotActive = true
    hotspotKey = key
    rig.azGoalBase = THREE.MathUtils.degToRad(CONFIG[h.cfg.az])
    rig.elGoalBase = THREE.MathUtils.degToRad(CONFIG[h.cfg.el])
    focusFacility(key, true) // frames from the new angles
    rig.zoomGoal = Math.min(rig.zoomGoal / Math.max(0.4, CONFIG[h.cfg.zoom]), 4.5)
    renderCrumbs()
  }

  function applyHotspotStyle() {
    for (const h of HOTSPOT_DEFS) {
      h.el.style.setProperty('--hs-color', CONFIG.hsColor)
      h.el.style.setProperty('--hs-speed', CONFIG.hsSpeed + 's')
      h.el.style.width = CONFIG.hsSize + 'px'
      h.el.style.height = CONFIG.hsSize + 'px'
      h.el.style.opacity = CONFIG.hsOpacity
    }
  }

  function updateHotspot() {
    for (const h of HOTSPOT_DEFS) {
      const f = facilities[h.key]
      if (!f) continue
      // Only invites you deeper once you're already looking at that facility
      const show = CONFIG.hsSize > 0 && focusedKey === h.key && !hotspotActive && !tourActive && f.vis > 0.5
      if ((h.el.style.display === 'block') !== show) h.el.style.display = show ? 'block' : 'none'
      if (!show) continue
      hsWorld.copy(f.center)
      hsWorld.x += CONFIG[h.cfg.offX]
      hsWorld.y += CONFIG[h.cfg.offY] + (f.group.position.y - f.baseY)
      hsWorld.z += CONFIG[h.cfg.offZ]
      hsWorld.project(camera)
      h.el.style.left = ((hsWorld.x * 0.5 + 0.5) * wrap.clientWidth) + 'px'
      h.el.style.top = ((-hsWorld.y * 0.5 + 0.5) * wrap.clientHeight) + 'px'
    }
  }

  function handleSceneClick(e) {
    if (!sceneBox || !hoverMeshes.length) return
    cancelTour('click')
    const r = wrap.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    )
    if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) return
    raycaster.setFromCamera(ndc, camera)
    // 1) Inside the DAC close-up, clicking a glowing part shows its micro-copy
    //    (and does NOT exit the view).
    const partCtx = partContext()
    if (partCtx && dacPartMeshes.length) {
      const ph = raycaster.intersectObjects(dacPartMeshes, false)
      const hit = ph.find(h => h.object.userData.partFk === partCtx)
      if (hit) {
        const pc = partCopyFor(hit.object.userData.dacPart)
        if (pc) { showPartPanel(hit.point, pc.title, pc.body); return }
      }
    }
    hideCallout()
    hidePartPanel()
    const hits = raycaster.intersectObjects(hoverMeshes, false)
    // 2) Dashed routes — must be tested BEFORE tiles win: a click on a
    //    ground-level line continues along the ray and often strikes a tile
    //    face further back, so "nearest hit wins" is the only correct rule.
    //    (Raycaster ignores `visible`, so ghost-hidden picks are filtered.)
    if (!focusedKey && CONFIG.flowOn && flowPickMeshes.length) {
      const fh = raycaster.intersectObjects(flowPickMeshes, false).filter(h => h.object.visible)
      if (fh.length && (!hits.length || fh[0].distance < hits[0].distance)) {
        selectFlowLine(fh[0].object.userData.flowRec, fh[0].point)
        return
      }
    }
    // 3) Tiles — hop / focus / reset as before
    let key = null
    if (hits.length) {
      const k = hits[0].object.userData.facilityKey
      if (k && facilities[k]) key = k // any tile — ghosted ones hop directly
    }
    if (key && key !== focusedKey) { focusFacility(key); return }
    if (key && key === focusedKey) { resetFocus(); return }
    if (activeFlow) { clearFlowSelect(); return } // panel already hidden above
    if (focusedKey) resetFocus()
  }

  /* ----------------------------------------------------------------------------
   MATERIAL OVERRIDES (Pipes / Earth / Wellhead) — opt-in, ported from Omma.
   Classified meshes get private material clones; toggling Off restores the
   baked look exactly. baseColor is kept in sync so pathway dimming still works.
---------------------------------------------------------------------------- */
  const pipeMeshes = [], earthMeshes = [], wellheadMeshes = []

  function classifyOverrides(eco) {
    eco.traverse((o) => {
      if (!o.isMesh || !o.userData.facilityKey) return // facilities only
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const n = ((o.name || '') + ' ' + mats.map(m => (m && m.name) || '').join(' ')).toLowerCase()
      if (/wellhead|well[\s_-]?head/.test(n)) wellheadMeshes.push(o)
      else if (/earth|terrain|land|ocean|sea|continent|layer|fracture|polygon/.test(n)) earthMeshes.push(o)
      else if (/pipe|tube|duct|conduit|valve|manifold|flange|pipeline/.test(n)) pipeMeshes.push(o)
    })
    const own = (mesh) => {
      const key = mesh.userData.facilityKey
      const clone1 = (m) => {
        if (!m) return m
        const c = m.clone() // note: clone() JSON-garbles userData — rebuilt below
        c.userData = {
          baseColor: c.color ? c.color.clone() : null,
          baseOpacity: m.userData.baseOpacity ?? (c.opacity ?? 1),
          baseTransparent: m.userData.baseTransparent ?? !!c.transparent,
          baseDepthWrite: m.userData.baseDepthWrite ?? c.depthWrite,
          orig: {
            color: c.color ? c.color.clone() : null,
            metalness: c.metalness, roughness: c.roughness,
            emissive: c.emissive ? c.emissive.clone() : null,
            emissiveIntensity: c.emissiveIntensity,
          },
        }
        if (facilities[key]) {
          facilities[key].mats.push(c)
          patchGhost(c, facilities[key].fadeUniform) // clone() drops onBeforeCompile — re-patch
        }
        return c
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone1) : clone1(mesh.material)
    };
    [...pipeMeshes, ...earthMeshes, ...wellheadMeshes].forEach(own)
    console.log('[explorer] overrides — pipes:', pipeMeshes.length, 'earth:', earthMeshes.length, 'wellheads:', wellheadMeshes.length)
  }

  /* ----------------------------------------------------------------------------
   DAC PART HOVER — only inside the hotspot close-up: the fan banks, calciner
   tower, pellet-reactor tank cluster, and each individual fan glow with a
   color tint under the cursor. Parts get private material clones (re-patched
   for ghosting, like the overrides above) so a highlight never bleeds into a
   neighboring structure that shares the same source material.
---------------------------------------------------------------------------- */
  const DAC_PARTS = []
  const dacPartMeshes = []
  let hoveredPart = null

  // Per-facility part matchers: mesh name + ancestor-name chain → part key.
  // EOR's matcher expects the facility mesh to be split into named groups
  // (Tower… / Separat… / Compress…) — the V6 export ships it as one merged
  // "Facility" mesh, so until the split lands only the wellhead lights up.
  const PART_MATCHERS = {
    dac: (mesh, chain) => {
      if (/fans/i.test(mesh.name || '')) return 'fan:' + mesh.uuid // every fan is its own part
      for (const n of chain) {
        if (/^air[\s_.]*1/i.test(n)) return 'air1'
        if (/^air[\s_.]*2/i.test(n)) return 'air2'
        if (/calsigner|calciner/i.test(n)) return 'tower'
        if (/^pellet/i.test(n)) return 'pellet'
      }
      return null
    },
    eor: (mesh, chain) => {
      for (const n of chain) {
        if (/wellhead/i.test(n)) return 'eorwell'
        if (/tower/i.test(n)) return 'eortowers'
        if (/sep[ae]rat/i.test(n)) return 'eorsep' // V7 group is spelled "Seperation"
        if (/compress|^gas/i.test(n)) return 'eorcomp' // V7 group is named "Gas"
      }
      return null
    },
    water: (mesh, chain) => {
      for (const n of chain) {
        if (/water[\s_]*tanks/i.test(n)) return 'watclar' // basins + skimmers + water
        if (/tank01|^office|^duct/i.test(n)) return 'wattanks' // storage tanks + buildings
        if (/tank[\s_]*tower|pill[\s_]*tank|^pallet/i.test(n)) return 'watchem' // silos, pill vessels, pallets
      }
      return null
    },
    sequestration: (mesh, chain) => {
      for (const n of chain) {
        if (/wellhead/i.test(n)) return 'seqwell' // Select 1
        if (/6[-_ ]?pack|^group/i.test(n)) return 'seqpack' // Select 2: 6-PACK + Group
        if (/^hut|^[\s_]*tank$/i.test(n)) return 'seqhut' // Select 3: Hut + Tank (node is " Tank" w/ leading space)
      }
      return null
    },
  }

  // eslint-disable-next-line no-unused-vars -- retired here; the per-facility pages own this layer
  function setupFacilityParts(fk) {
    const fac = facilities[fk]
    const matcher = PART_MATCHERS[fk]
    if (!fac || !matcher) return
    const partOf = (mesh) => {
      const chain = []
      let p = mesh
      while (p && p !== fac.group) { chain.push(p.name || ''); p = p.parent }
      return matcher(mesh, chain)
    }
    const parts = new Map()
    fac.group.traverse((o) => {
      if (!o.isMesh || o.userData.isFxRing) return
      const pk = partOf(o)
      if (!pk) return
      if (!parts.has(pk)) parts.set(pk, { key: pk, fk, mats: [], cloneMap: new Map(), fade: 0, goal: 0, _on: false })
      const part = parts.get(pk)
      o.userData.dacPart = pk
      o.userData.partFk = fk
      dacPartMeshes.push(o)
      const clone1 = (m) => {
        if (!m) return m
        if (part.cloneMap.has(m.uuid)) return part.cloneMap.get(m.uuid)
        const wasMetal = m.userData.adjMetalBase !== undefined // came from the metal-adjust pass
        const c = m.clone() // clone() JSON-garbles userData + drops onBeforeCompile — rebuild both
        c.userData = {
          baseColor: c.color ? c.color.clone() : null,
          baseOpacity: m.userData.baseOpacity ?? (c.opacity ?? 1),
          baseTransparent: m.userData.baseTransparent ?? !!c.transparent,
          baseDepthWrite: m.userData.baseDepthWrite ?? c.depthWrite,
          baseEmissive: c.emissive ? c.emissive.clone() : null,
          baseEmissiveIntensity: c.emissiveIntensity,
          // carry the metal-adjust baselines so applyDacMetalProps drives this clone
          adjMetalBase: m.userData.adjMetalBase, adjRoughBase: m.userData.adjRoughBase,
          // keep the pipe/earth/wellhead override baseline alive on the new clone
          orig: m.userData.orig
            ? {
                color: m.userData.orig.color ? m.userData.orig.color.clone() : null,
                metalness: m.userData.orig.metalness, roughness: m.userData.orig.roughness,
                emissive: m.userData.orig.emissive ? m.userData.orig.emissive.clone() : null,
                emissiveIntensity: m.userData.orig.emissiveIntensity,
              }
            : undefined,
        }
        fac.mats.push(c)
        if (wasMetal) { patchGhost(c, fac.fadeUniform, dacAdj); dacMetalMats.push(c) }
        else patchGhost(c, fac.fadeUniform)
        part.cloneMap.set(m.uuid, c)
        part.mats.push(c)
        return c
      }
      o.material = Array.isArray(o.material) ? o.material.map(clone1) : clone1(o.material)
    })
    DAC_PARTS.push(...parts.values())
    console.log('[explorer] hover parts (' + fk + '):', parts.size)
  }

  function updateDacParts(dt) {
    if (!DAC_PARTS.length) return
    for (const p of DAC_PARTS) {
      p.fade = THREE.MathUtils.damp(p.fade, p.goal, CONFIG.dacHovFade, dt)
      if (p.fade < 0.002 && p.goal === 0) {
        if (p._on) { // restore whatever emissive the material shipped with
          p._on = false
          p.mats.forEach((m) => {
            if (m.userData.baseEmissive) m.emissive.copy(m.userData.baseEmissive)
            m.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1
          })
        }
        continue
      }
      p._on = true
      const hovColor = p.fk === 'dac' ? CONFIG.dacHovColor : CONFIG.eorHovColor
      const hovStrength = p.fk === 'dac' ? CONFIG.dacHovStrength : CONFIG.eorHovStrength
      p.mats.forEach((m) => {
        if (!m.emissive) return
        m.emissive.set(hovColor)
        m.emissiveIntensity = p.fade * hovStrength
      })
    }
  }

  /* ----------------------------------------------------------------------------
   WATER SURFACE — the clarifier basins' flat "water" discs get animated
   normal-perturbation ripples (pond shimmer through lighting/reflections)
   plus a reflective material treatment. Subtle, slow, dialable.
---------------------------------------------------------------------------- */
  const waterUni = {
    uWTime: { value: 0 },
    uWAmp: { value: 0.35 }, // shimmer (fragment normal wobble)
    uWScale: { value: 2.5 },
    uWWarp: { value: 0.8 }, // domain-warp: 0 = regular grid, higher = irregular fractal
    uWSwell: { value: 0.035 }, // vertex swell height (world units)
  }
  const waterMats = []

  // Subdivided polar disc (rings x segments) — uv.y = 0 at center, 1 at rim,
  // so the shader can calm the swells to zero at the tank wall.
  function makeWaterDisc(cx, y, cz, r) {
    const SEG = 48, RINGS = 8
    const pos = [0 + cx, y, 0 + cz], uv = [0, 0], idx = []
    for (let ri = 1; ri <= RINGS; ri++) {
      const rr = r * ri / RINGS
      for (let s = 0; s < SEG; s++) {
        const a = (s / SEG) * Math.PI * 2
        pos.push(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr)
        uv.push(s / SEG, ri / RINGS)
      }
    }
    for (let s = 0; s < SEG; s++) idx.push(0, 1 + s, 1 + (s + 1) % SEG)
    for (let ri = 0; ri < RINGS - 1; ri++) {
      const a0 = 1 + ri * SEG, b0 = 1 + (ri + 1) * SEG
      for (let s = 0; s < SEG; s++) {
        const s1 = (s + 1) % SEG
        idx.push(a0 + s, b0 + s, b0 + s1, a0 + s, b0 + s1, a0 + s1)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    const nrm = new Float32Array(pos.length)
    for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
    g.setIndex(idx)
    return g
  }

  function patchWater(m, fadeUniform) {
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uGhostFade = fadeUniform
      shader.uniforms.uGhostColor = { value: GHOST_COLOR }
      shader.uniforms.uWTime = waterUni.uWTime
      shader.uniforms.uWAmp = waterUni.uWAmp
      shader.uniforms.uWScale = waterUni.uWScale
      shader.uniforms.uWWarp = waterUni.uWWarp
      shader.uniforms.uWSwell = waterUni.uWSwell
      shader.vertexShader = ('uniform float uWTime;\nuniform float uWScale;\nuniform float uWSwell;\nvarying vec3 vWPos;\n' + shader.vertexShader).replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
      {
        vec4 wp4 = modelMatrix * vec4(transformed, 1.0);
        float sw = sin(wp4.x * uWScale * 1.1 + uWTime) * 0.55
                 + cos(wp4.z * uWScale * 0.9 - uWTime * 0.8) * 0.45
                 + sin((wp4.x + wp4.z) * uWScale * 1.9 + uWTime * 1.25) * 0.25;
        float rim = 1.0 - uv.y * uv.y;  // dead calm at the tank wall
        transformed.y += sw * uWSwell * rim;
      }`,
      ).replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
      shader.fragmentShader = ('uniform float uGhostFade;\nuniform vec3 uGhostColor;\nuniform float uWTime;\nuniform float uWAmp;\nuniform float uWScale;\nuniform float uWWarp;\nvarying vec3 vWPos;\n' + shader.fragmentShader)
        .replace('#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
        {
          vec2 p = vWPos.xz * uWScale;
          float t = uWTime;
          // Domain warp — bends the sample space with a slow secondary field so
          // the ripples stop lining up into a repeating grid. 0 = regular.
          vec2 w = vec2(
            sin(p.y * 0.9 + t * 0.7) + sin(p.x * 0.53 - p.y * 0.31 + t * 0.43),
            cos(p.x * 0.8 - t * 0.61) + cos(p.y * 0.47 + p.x * 0.29 - t * 0.37)
          );
          p += w * uWWarp;
          float dx = cos(p.x * 1.7 + t) * 0.6 + cos((p.x * 0.7 + p.y * 1.3) * 2.3 - t * 0.8) * 0.4;
          float dz = sin(p.y * 1.9 - t * 0.9) * 0.6 + sin((p.x * 1.1 - p.y * 0.6) * 2.1 + t * 0.7) * 0.4;
          vec3 wN = normalize(vec3(-dx * 0.35 * uWAmp, 1.0, -dz * 0.35 * uWAmp));
          normal = normalize((viewMatrix * vec4(wN, 0.0)).xyz);
        }`)
        .replace('#include <clearcoat_normal_fragment_maps>',
          '#include <clearcoat_normal_fragment_maps>\nclearcoatNormal = normal;')
        .replace('#include <dithering_fragment>',
          'gl_FragColor.rgb = mix(gl_FragColor.rgb, uGhostColor, uGhostFade);\n#include <dithering_fragment>')
      m.userData.shader = shader
    }
    m.needsUpdate = true
  }

  // Dedicated sky reflection for the water only. The scene's lighting environment
  // is a neutral studio rig (big white softboxes) — mirrored in a glossy surface it
  // reads as chalky white smears. Real ponds read as water because they reflect
  // sky: blue overhead, bright toward the horizon, one soft sun. This builds that
  // sky as a tiny generated texture and assigns it as the water's private envMap.
  let waterEnv = null
  let waterEnvDirty = false
  function makeWaterEnv() {
  // The picker drives the BRIGHT part of the reflection — the horizon band and
  // sun glints, i.e. the tone you actually see streaking across the surface.
  // All darker sky stops are derived from it, so the chip always matches what
  // shows up on the water.
    const hi = new THREE.Color(CONFIG.waterSkyColor)
    const grey = new THREE.Color('#6a747c')
    const hex = col => '#' + col.getHexString()
    const scale = (col, k) => col.clone().multiplyScalar(k)
    const horizon = hex(hi) // the specular tone
    const mid = hex(scale(hi, 0.78))
    const zenith = hex(scale(hi, 0.55))
    const dusk = hex(scale(hi.clone().lerp(grey, 0.35), 0.7))
    const below = hex(scale(hi.clone().lerp(grey, 0.55), 0.5))
    const sunCore = hi.clone().lerp(new THREE.Color('#ffffff'), 0.3)
    const sc = Math.round(sunCore.r * 255) + ',' + Math.round(sunCore.g * 255) + ',' + Math.round(sunCore.b * 255)
    const c = document.createElement('canvas')
    c.width = 512; c.height = 256
    const g = c.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0.0, zenith)
    grad.addColorStop(0.35, mid)
    grad.addColorStop(0.5, horizon) // bright horizon band
    grad.addColorStop(0.56, dusk)
    grad.addColorStop(1.0, below) // below horizon
    g.fillStyle = grad; g.fillRect(0, 0, 512, 256)
    const sun = g.createRadialGradient(150, 66, 4, 150, 66, 70)
    sun.addColorStop(0, 'rgba(' + sc + ',1)')
    sun.addColorStop(0.22, 'rgba(' + sc + ',0.5)')
    sun.addColorStop(1, 'rgba(' + sc + ',0)')
    g.fillStyle = sun; g.fillRect(0, 0, 512, 256)
    const tex = new THREE.CanvasTexture(c)
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }
  // Rebuilding the env re-runs the renderer's PMREM prefilter, so batch color
  // drags to at most one rebuild per frame (handled in the animate loop).
  // eslint-disable-next-line no-unused-vars -- sky-colour tuning hook from the handoff build
  function applyWaterEnv() { waterEnvDirty = true }
  function setupWater() {
    const water = facilities.water
    if (!water) return
    if (!waterEnv) waterEnv = makeWaterEnv()
    water.group.traverse((o) => {
      if (!o.isMesh || o.userData.isFxRing) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const isWater = mats.some(m => m && (m.name || '').toLowerCase() === 'water') || /water[-_ ]?water/i.test(o.name || '')
      if (!isWater) return
      // Rebuild the flat 37-vert disc as a subdivided surface the swells can move
      const old = o.geometry
      old.computeBoundingBox()
      const bb = old.boundingBox
      const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2
      const r = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2
      o.geometry = makeWaterDisc(cx, bb.max.y, cz, r)
      old.dispose()
      // Milky aqua base + wet clearcoat = pond glass
      const c = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CONFIG.waterTint),
        roughness: CONFIG.waterRough, metalness: 0,
        clearcoat: 1, clearcoatRoughness: CONFIG.waterGloss,
        envMap: waterEnv, envMapIntensity: CONFIG.waterReflect,
        side: THREE.DoubleSide,
      })
      c.name = 'water'
      c.userData = {
        baseColor: c.color.clone(),
        baseOpacity: 1, baseTransparent: false, baseDepthWrite: true,
        baseEmissive: new THREE.Color(0x000000), baseEmissiveIntensity: 1, // hover glow restores to dark
      }
      patchWater(c, water.fadeUniform)
      water.mats.push(c)
      waterMats.push(c)
      o.material = c
    })
    applyWaterProps()
    // The clarifier hover part registered BEFORE this pass swapped the disc
    // materials — hand it the live water materials so the surface glows too.
    const clar = DAC_PARTS.find(p => p.key === 'watclar')
    if (clar) clar.mats.push(...waterMats)
    console.log('[explorer] water surfaces:', waterMats.length)
  }
  function applyWaterProps() {
    for (const m of waterMats) {
      m.color.set(CONFIG.waterTint)
      if (m.userData.baseColor) m.userData.baseColor.set(CONFIG.waterTint)
      m.roughness = CONFIG.waterRough
      m.clearcoatRoughness = CONFIG.waterGloss
      m.envMapIntensity = CONFIG.waterReflect
      m.needsUpdate = true
    }
  }

  /* ----------------------------------------------------------------------------
   DAC METAL ADJUST — the DAC's structural meshes (fan walls, tower, tanks —
   everything except the earth block and its strata) get private material
   clones wired to live adjustment uniforms + metal/rough deltas.
---------------------------------------------------------------------------- */
  const dacMetalMats = []
  function setupDacMetal() {
    const dac = facilities.dac
    if (!dac) return
    const isEarthy = n => /earth|land|terrain|strata|layer|ground/i.test(n)
    dac.group.traverse((o) => {
      if (!o.isMesh || o.userData.isFxRing) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const n = (o.name || '') + ' ' + mats.map(m => (m && m.name) || '').join(' ')
      if (isEarthy(n)) return
      const clone1 = (m) => {
        if (!m) return m
        const c = m.clone()
        c.userData = {
          baseColor: c.color ? c.color.clone() : null,
          baseOpacity: m.userData.baseOpacity ?? (c.opacity ?? 1),
          baseTransparent: m.userData.baseTransparent ?? !!c.transparent,
          baseDepthWrite: m.userData.baseDepthWrite ?? c.depthWrite,
          adjMetalBase: c.metalness, adjRoughBase: c.roughness,
          orig: m.userData.orig,
        }
        patchGhost(c, dac.fadeUniform, dacAdj) // ghost mix + live adjust layer
        dac.mats.push(c)
        dacMetalMats.push(c)
        return c
      }
      o.material = Array.isArray(o.material) ? o.material.map(clone1) : clone1(o.material)
    })
    console.log('[explorer] DAC metal materials:', dacMetalMats.length)
  }
  function applyDacMetalProps() {
    for (const m of dacMetalMats) {
      if ('metalness' in m && m.userData.adjMetalBase !== undefined)
        m.metalness = THREE.MathUtils.clamp(m.userData.adjMetalBase + CONFIG.dmMetal, 0, 1)
      if ('roughness' in m && m.userData.adjRoughBase !== undefined)
        m.roughness = THREE.MathUtils.clamp(m.userData.adjRoughBase + CONFIG.dmRough, 0, 1)
    }
  }

  function eachMat(meshes, fn) {
    meshes.forEach((mesh) => {
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
        if (m && m.userData.orig) { fn(m, m.userData.orig); m.needsUpdate = true }
      })
    })
  }
  function applyPipes() {
    eachMat(pipeMeshes, (m, o) => {
      if (CONFIG.pipeOn) {
        if (m.color) m.color.set(CONFIG.pipeColor)
        if ('metalness' in m) m.metalness = CONFIG.pipeMetal
        if ('roughness' in m) m.roughness = CONFIG.pipeRough
      }
      else {
        if (m.color && o.color) m.color.copy(o.color)
        m.metalness = o.metalness; m.roughness = o.roughness
      }
      if (m.userData.baseColor && m.color) m.userData.baseColor.copy(m.color)
    })
    nudgeHighlight()
  }
  function applyEarth() {
    eachMat(earthMeshes, (m, o) => {
      if (CONFIG.earthOn) {
        if (m.color && o.color) m.color.copy(o.color).multiplyScalar(CONFIG.earthBright)
        if (m.emissive && o.color) { m.emissive.copy(o.color); m.emissiveIntensity = CONFIG.earthEmissive }
        if ('roughness' in m) m.roughness = CONFIG.earthRough
        if ('metalness' in m) m.metalness = CONFIG.earthMetal
      }
      else {
        if (m.color && o.color) m.color.copy(o.color)
        if (m.emissive && o.emissive) { m.emissive.copy(o.emissive); m.emissiveIntensity = o.emissiveIntensity }
        m.roughness = o.roughness; m.metalness = o.metalness
      }
      if (m.userData.baseColor && m.color) m.userData.baseColor.copy(m.color)
    })
    nudgeHighlight()
  }
  function applyWellheads() {
    eachMat(wellheadMeshes, (m, o) => {
      if (CONFIG.wellheadOn) {
        if (m.color) m.color.set(CONFIG.wellheadColor)
        if ('metalness' in m) m.metalness = CONFIG.wellheadMetal
        if ('roughness' in m) m.roughness = CONFIG.wellheadRough
      }
      else {
        if (m.color && o.color) m.color.copy(o.color)
        m.metalness = o.metalness; m.roughness = o.roughness
      }
      if (m.userData.baseColor && m.color) m.userData.baseColor.copy(m.color)
    })
    nudgeHighlight()
  }

  /* ----------------------------------------------------------------------------
   DAC FANS — every "Fans.N" mesh in the DAC tile spins slowly in place.
   Pivots are re-centered on each fan's hub so they rotate true.
---------------------------------------------------------------------------- */
  const fanMeshes = []
  function setupFans() {
    const dac = facilities.dac
    if (!dac) return
    dac.group.traverse((o) => {
      if (!o.isMesh || !/fans/i.test(o.name || '')) return
      const geo = o.geometry
      geo.computeBoundingBox()
      const size = geo.boundingBox.getSize(new THREE.Vector3())
      const center = geo.boundingBox.getCenter(new THREE.Vector3())
      // Spin axis = the fan disc's thinnest local dimension
      o.userData.fanAxis
        = size.x <= size.y && size.x <= size.z
          ? new THREE.Vector3(1, 0, 0)
          : size.y <= size.z
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(0, 0, 1)
      // Move the pivot to the hub so blades spin in place (geometry may be
      // shared between fans after optimization — translate it only once)
      if (!geo.userData._fanCentered) {
        geo.translate(-center.x, -center.y, -center.z)
        geo.userData._fanCentered = true
        geo.computeBoundingBox()
      }
      o.position.add(center.clone().multiply(o.scale).applyQuaternion(o.quaternion))
      fanMeshes.push(o)
    })
    console.log('[explorer] DAC fans spinning:', fanMeshes.length)
  }
  function updateFans(dt) {
    if (!fanMeshes.length || !CONFIG.fanRpm) return
    const step = (CONFIG.fanRpm * Math.PI * 2 / 60) * dt
    for (const m of fanMeshes) m.rotateOnAxis(m.userData.fanAxis, step)
  }

  /* ----------------------------------------------------------------------------
   DAC AIR-INTAKE LINES — dashed streams arcing out of the sky into each fan
   (the fans pull carbon out of the air). One shared animated dash material.
---------------------------------------------------------------------------- */
  const airRoot = new THREE.Group()
  airRoot.name = 'dacAirLines'
  const airUniforms = {
    uFlowT: { value: 0 }, // dash scroll (time * flow speed)
    uDashN: { value: 9 }, // dashes along each line
    uDuty: { value: 0.55 }, // dash/gap ratio
  }
  let airMat = null
  function makeAirMaterial() {
    const mat = new THREE.MeshBasicMaterial({
      color: CONFIG.airColor, transparent: true, opacity: CONFIG.airOpacity,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    })
    mat.defines = { USE_UV: '' } // vUv.x runs along the tube (0 = sky, 1 = fan)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlowT = airUniforms.uFlowT
      shader.uniforms.uDashN = airUniforms.uDashN
      shader.uniforms.uDuty = airUniforms.uDuty
      shader.fragmentShader = ('uniform float uFlowT;\nuniform float uDashN;\nuniform float uDuty;\n' + shader.fragmentShader).replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      {
        float d = fract(vUv.x * uDashN - uFlowT);
        float dash = smoothstep(0.0, 0.10, d) * (1.0 - smoothstep(uDuty - 0.10, uDuty, d));
        float tail = smoothstep(0.0, 0.16, vUv.x); // fade the far (sky) end
        diffuseColor.a *= dash * tail;
      }`,
      )
      mat.userData.shader = shader
    }
    return mat
  }

  function buildAirLines() {
    const dac = facilities.dac
    if (!dac || !fanMeshes.length) return
    // wipe previous tubes
    for (let i = airRoot.children.length - 1; i >= 0; i--) {
      const c = airRoot.children[i]
      c.geometry.dispose()
      airRoot.remove(c)
    }
    if (!airMat) airMat = makeAirMaterial()
    airMat.color.set(CONFIG.airColor)
    airMat.opacity = CONFIG.airOpacity

    dac.group.add(airRoot)
    dac.group.updateMatrixWorld(true)
    const tileCenter = dac.box0.getCenter(new THREE.Vector3())
    const up = new THREE.Vector3(0, 1, 0)

    // Group fans by wall (their air.* ancestor) so every line on a wall shares
    // ONE direction — the wall's outward normal. No fanning out.
    const walls = new Map()
    for (const fan of fanMeshes) {
      let p = fan.parent, key = 'wall'
      while (p && p !== dac.group) { if (/^air/i.test(p.name || '')) { key = p.name; break } p = p.parent }
      if (!walls.has(key)) walls.set(key, [])
      walls.get(key).push(fan)
    }

    const wpA = new THREE.Vector3(), wpB = new THREE.Vector3(), wp = new THREE.Vector3()
    for (const fans of walls.values()) {
      fans[0].getWorldPosition(wpA)
      fans[fans.length - 1].getWorldPosition(wpB)
      const dir = wpB.clone().sub(wpA).setY(0).normalize() // along the wall
      const n = new THREE.Vector3().crossVectors(up, dir).normalize() // wall normal
      const mid = wpA.clone().add(wpB).multiplyScalar(0.5)
      if (n.dot(mid.clone().sub(tileCenter).setY(0)) < 0) n.multiplyScalar(-1) // outward

      for (const fan of fans) {
        fan.getWorldPosition(wp)
        for (let i = 0; i < CONFIG.airPerFan; i++) {
          const lat = CONFIG.airPerFan === 1 ? 0 : (i / (CONFIG.airPerFan - 1) - 0.5) * 1.2
          const jitter = 0.85 + 0.3 * ((i + fan.id) % 3) / 2
          // End on the building's outer SIDE face, below the roof line
          const p2 = wp.clone()
            .addScaledVector(n, CONFIG.airSide)
            .addScaledVector(up, -CONFIG.airDrop)
            .addScaledVector(dir, lat * 0.3)
          const p0 = p2.clone()
            .addScaledVector(n, CONFIG.airReach * jitter)
            .addScaledVector(up, CONFIG.airHeight * jitter)
            .addScaledVector(dir, lat)
          // Control low + outward = concave sweep flattening into the wall
          const p1 = p2.clone()
            .addScaledVector(n, CONFIG.airReach * 0.5 * jitter)
            .addScaledVector(up, CONFIG.airHeight * 0.12 * jitter)
            .addScaledVector(dir, lat * 0.6)
          const curve = new THREE.QuadraticBezierCurve3(
            dac.group.worldToLocal(p0), dac.group.worldToLocal(p1), dac.group.worldToLocal(p2),
          )
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, CONFIG.airThick, 5, false), airMat)
          tube.userData.isFxRing = true // excluded from shadows / AO, like the rings
          tube.castShadow = false; tube.receiveShadow = false
          airRoot.add(tube)
        }
      }
    }
    airRoot.visible = false // per-frame gate below decides
  }

  let airFade = 0
  function updateAirLines(t, dt) {
    const dac = facilities.dac
    if (!dac || !airRoot.children.length) return
    const want = CONFIG.airOn && dac.vis > 0.5 && (!CONFIG.airFocusOnly || focusedKey === 'dac')
    airFade = THREE.MathUtils.damp(airFade, want ? 1 : 0, 3, dt) // eases with the camera
    const show = airFade > 0.005
    if (airRoot.visible !== show) airRoot.visible = show
    if (!show) return
    if (airMat) airMat.opacity = CONFIG.airOpacity * airFade
    airUniforms.uFlowT.value = t * CONFIG.airFlow
    airUniforms.uDashN.value = CONFIG.airDash
  }

  /* ----------------------------------------------------------------------------
   FLOW LINE ENGINE — dashed tubes on the floor between tiles, dashes moving
   from → to. Active lines follow the tabs; inactive ones ghost like the tiles.
---------------------------------------------------------------------------- */
  const flowRoot = new THREE.Group()
  flowRoot.name = 'flowLines'
  scene.add(flowRoot)
  const flowShared = {
    uFlowT: { value: 0 },
    uDuty: { value: 0.55 },
  }
  const flowRuntime = [] // { line, mats:[], fade, goal }

  function makeFlowMaterial(color) {
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: CONFIG.flowOpacity,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    })
    mat.defines = { USE_UV: '' }
    mat.userData.widthUni = { value: 1 } // live hover-thicken multiplier
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlowT = flowShared.uFlowT
      shader.uniforms.uDuty = flowShared.uDuty
      shader.uniforms.uDashN = { value: mat.userData.dashN || 10 }
      shader.uniforms.uWidthMul = mat.userData.widthUni
      shader.vertexShader = ('attribute vec2 aOff;\nuniform float uWidthMul;\n' + shader.vertexShader).replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed.x += aOff.x * (uWidthMul - 1.0);\ntransformed.z += aOff.y * (uWidthMul - 1.0);',
      )
      shader.fragmentShader = ('uniform float uFlowT;\nuniform float uDuty;\nuniform float uDashN;\n' + shader.fragmentShader).replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      {
        float d = fract(vUv.x * uDashN - uFlowT);
        float dash = smoothstep(0.0, 0.10, d) * (1.0 - smoothstep(uDuty - 0.10, uDuty, d));
        float ends = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);
        diffuseColor.a *= dash * ends;
      }`,
      )
      mat.userData.shader = shader
    }
    return mat
  }

  // Walk from a tile's centre toward `toward` until leaving its footprint —
  // the line docks just inside the tile edge, emerging from under the block.
  function edgePoint(key, toward) {
    const f = facilities[key]
    const c = f.box0.getCenter(new THREE.Vector3())
    const b = f.box0
    for (let i = 0; i <= 60; i++) {
      const t = i / 60
      const x = THREE.MathUtils.lerp(c.x, toward.x, t)
      const z = THREE.MathUtils.lerp(c.z, toward.y, t) // toward is Vector2: .y holds world Z
      if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) {
        const tt = Math.max(0, t - 0.04) // tuck slightly under the edge
        return new THREE.Vector2(THREE.MathUtils.lerp(c.x, toward.x, tt), THREE.MathUtils.lerp(c.z, toward.y, tt))
      }
    }
    return new THREE.Vector2(c.x, c.z)
  }

  // Infinite-line intersection (for mitered elbows)
  function lineIntersect2(a1, a2, b1, b2) {
    const den = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
    if (Math.abs(den) < 1e-6) return null // parallel — butt joint
    const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / den
    return new THREE.Vector2(a1.x + t * (a2.x - a1.x), a1.y + t * (a2.y - a1.y))
  }

  // Offset a 2D polyline sideways, keeping sharp mitered corners
  function offsetPoly(pts, o) {
    if (pts.length < 2 || o === 0) return pts.map(p => p.clone())
    const segs = []
    for (let i = 0; i < pts.length - 1; i++) {
      const d = pts[i + 1].clone().sub(pts[i]).normalize()
      const n = new THREE.Vector2(-d.y, d.x).multiplyScalar(o)
      segs.push({ a: pts[i].clone().add(n), b: pts[i + 1].clone().add(n) })
    }
    const out = [segs[0].a]
    for (let i = 0; i < segs.length - 1; i++) {
      out.push(lineIntersect2(segs[i].a, segs[i].b, segs[i + 1].a, segs[i + 1].b) || segs[i].b)
    }
    out.push(segs[segs.length - 1].b)
    return out
  }

  // Round each interior elbow with a fillet arc of the given radius
  function roundCorners(pts, r) {
    if (r <= 0.02 || pts.length < 3) return pts
    const out = [pts[0].clone()]
    for (let i = 1; i < pts.length - 1; i++) {
      const A = pts[i - 1], B = pts[i], C = pts[i + 1]
      const d1 = B.clone().sub(A), d2 = C.clone().sub(B)
      const l1 = d1.length(), l2 = d2.length()
      const rr = Math.min(r, l1 * 0.49, l2 * 0.49)
      if (rr < 0.02 || l1 < 1e-4 || l2 < 1e-4) { out.push(B.clone()); continue }
      const pIn = B.clone().addScaledVector(d1, -rr / l1)
      const pOut = B.clone().addScaledVector(d2, rr / l2)
      for (let s = 0; s <= 8; s++) {
        const t = s / 8, u = 1 - t
        out.push(new THREE.Vector2(
          pIn.x * u * u + B.x * 2 * u * t + pOut.x * t * t,
          pIn.y * u * u + B.y * 2 * u * t + pOut.y * t * t,
        ))
      }
    }
    out.push(pts[pts.length - 1].clone())
    return out
  }

  // Flat ribbon on the floor along a polyline — straight legs, hard elbows.
  // uv.x runs 0→1 along the whole line (drives the dash flow).
  function ribbonGeometry(pts, width, floorY) {
    const L = offsetPoly(pts, width / 2)
    const R = offsetPoly(pts, -width / 2)
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]))
    const total = cum[cum.length - 1] || 1
    const pos = [], uv = [], off = [], idx = []
    for (let i = 0; i < pts.length; i++) {
      pos.push(L[i].x, floorY, L[i].y, R[i].x, floorY, R[i].y)
      // lateral vector from the centerline — lets a shader swell the ribbon live
      off.push(L[i].x - pts[i].x, L[i].y - pts[i].y, R[i].x - pts[i].x, R[i].y - pts[i].y)
      const u = cum[i] / total
      uv.push(u, 0, u, 1)
      if (i > 0) { const k = 2 * i; idx.push(k - 2, k - 1, k, k - 1, k + 1, k) }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 2))
    g.setIndex(idx)
    return { geometry: g, length: total }
  }

  // Hover a route: it swells. Click: a glass panel explains the integration.
  // Click off: panel fades, the line eases back to thin.
  const flowPickMeshes = []
  let hoveredFlow = null
  let activeFlow = null
  const FLOW_FAMILY_LABEL = { oil: 'Crude & gas', power: 'Low-carbon power', water: 'Produced water', co2: 'Captured CO₂' }
  const FLOW_COPY = {
    G1: { title: 'Oil and Gas to Midstream', body: 'Our oil and gas production flows through our midstream and marketing business for gathering and transport to market.' },
    G2: { title: 'EOR Barrels to Midstream', body: 'Oil recovered with CO₂ moves through the same midstream network.' },
    R1: { title: 'Powering Our Operations', body: 'We manage power to our oil and gas operations. Natural gas can also be used to support power generation and lower-carbon power when paired with carbon capture.' },
    R2: { title: 'Powering EOR', body: 'Lower-carbon power helps support enhanced oil recovery operations, including through our Goldsmith Solar facility, which powers the Goldsmith EOR field in West Texas.' },
    R3: { title: 'Powering Direct Air Capture', body: 'Power for DAC will come from new renewable or low-emission sources, helping meet energy needs without reducing existing renewable power available on the grid.' },
    Y1: { title: 'Produced Water Management', body: 'Through treatment and recycling, we maximize use of produced water, helping reduce freshwater demand while supporting production and advanced recovery.' },
    Y2: { title: 'Recycled Water to EOR', body: 'Treated water heads back to the recovery field — closing the loop instead of ending at disposal.' },
    B1: { title: 'Power Generation with CCUS', body: 'CO₂ can be captured from natural gas power facilities and used to support EOR operations.' },
    B2: { title: 'DAC CO₂ to EOR', body: 'CO₂ captured at our DAC facilities can be used in our EOR operations to support advanced recovery and lower-carbon fuels.' },
    B3: { title: 'DAC CO₂ to Storage', body: 'CO₂ captured at our DAC facilities can be stored in dedicated sequestration hubs to generate carbon dioxide removal credits that help address emissions.' },
  }

  function flowCopyOf(line) {
    const A = facilities[line.from], B = facilities[line.to]
    return FLOW_COPY[line.id] || {
      title: FLOW_FAMILY_LABEL[line.family],
      body: (A ? A.label : line.from) + ' → ' + (B ? B.label : line.to),
    }
  }
  function selectFlowLine(rec, point) {
    if (activeFlow === rec) { clearFlowSelect(); hidePartPanel(); return }
    activeFlow = rec
    const c = flowCopyOf(rec.line)
    showPartPanel(point, c.title, c.body)
  }
  function clearFlowSelect() {
    activeFlow = null
  }

  function buildFlowLines() {
    if (!sceneBox) return
    for (let i = flowRoot.children.length - 1; i >= 0; i--) {
      const m = flowRoot.children[i]
      m.geometry.dispose(); m.material.dispose()
      flowRoot.remove(m)
    }
    flowRuntime.length = 0
    flowPickMeshes.length = 0
    hoveredFlow = null
    activeFlow = null
    const floorY = sceneBox.min.y + CONFIG.flowHeight

    for (const line of FLOW_LINES) {
      const A = facilities[line.from], B = facilities[line.to]
      if (!A || !B) continue
      const sh = line.shift || [0, 0]
      const via = (line.via || []).map(([x, z]) => new THREE.Vector2(x, z))
      const cA = A.box0.getCenter(new THREE.Vector3()), cB = B.box0.getCenter(new THREE.Vector3())
      const firstToward = via[0] || new THREE.Vector2(cB.x, cB.z)
      const lastToward = via[via.length - 1] || new THREE.Vector2(cA.x, cA.z)
      const rawPts = [edgePoint(line.from, firstToward), ...via, edgePoint(line.to, lastToward)]
        .map(p => new THREE.Vector2(p.x + sh[0], p.y + sh[1]))
      if (line.ext) { // overshoot: continue past the docked endpoint along the final heading
        const a = rawPts[rawPts.length - 2], b = rawPts[rawPts.length - 1]
        b.add(b.clone().sub(a).normalize().multiplyScalar(line.ext))
      }
      const base = roundCorners(rawPts, CONFIG.flowRadius)

      const variants = line.both ? [1, -1] : [0]
      const mats = []
      for (const v of variants) {
        let pts = offsetPoly(base, v * 0.45) // separate the two-way directions
        if (v === -1) pts = pts.reverse() // return line flows the other way
        const { geometry, length } = ribbonGeometry(pts, CONFIG.flowThick * 2, floorY)
        const mat = makeFlowMaterial(CONFIG[FLOW_FAMILY_COLOR[line.family]])
        mat.userData.dashN = Math.max(3, length * CONFIG.flowDash)
        mat.userData.lineLen = length
        const mesh = new THREE.Mesh(geometry, mat)
        mesh.userData.isFxRing = true
        mesh.castShadow = false; mesh.receiveShadow = false
        flowRoot.add(mesh)
        mats.push(mat)
      }
      const rec = { line, mats, fade: line.exclusive ? 0 : 1, goal: line.exclusive ? 0 : 1, widthMul: 1 }
      // Fat invisible twin of the route for forgiving clicks
      const pick = new THREE.Mesh(
        ribbonGeometry(base, Math.max(CONFIG.flowThick * 12, 1.2), floorY + 0.05).geometry,
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false, side: THREE.DoubleSide }),
      )
      pick.userData.isFxRing = true
      pick.userData.flowRec = rec
      pick.castShadow = false; pick.receiveShadow = false
      flowRoot.add(pick)
      flowPickMeshes.push(pick)
      rec.pick = pick
      flowRuntime.push(rec)
    }
    flowRoot.visible = CONFIG.flowOn
  }

  function refreshFlowColors() {
    for (const r of flowRuntime) {
      const cfgKey = activePathway ? PATHWAY_THEME[activePathway] : FLOW_FAMILY_COLOR[r.line.family]
      r.mats.forEach(m => m.color.set(CONFIG[cfgKey]))
    }
  }

  function updateFlowLines(t, dt) {
    if (!flowRuntime.length) return
    if (flowRoot.visible !== CONFIG.flowOn) flowRoot.visible = CONFIG.flowOn
    if (!CONFIG.flowOn) return
    flowShared.uFlowT.value = t * CONFIG.flowSpeed
    for (const r of flowRuntime) {
      const tabOn = r.line.exclusive
        ? (activePathway && r.line.tabs.includes(activePathway) ? 1 : 0) // only on its tab
        : (!activePathway || r.line.tabs.includes(activePathway) ? 1 : 0)
      r.goal = focusedKey ? 0 : tabOn // spotlight mode: all lines ghost with the tiles
      r.fade = THREE.MathUtils.damp(r.fade, r.goal, focusedKey ? Math.min(CONFIG.hlSpeed, 2.2) : CONFIG.hlSpeed, dt)
      // hover / inspect swell — the ribbon widens in the vertex shader
      const wGoal = (r === hoveredFlow || r === activeFlow) ? CONFIG.flowHoverMul : 1
      r.widthMul = THREE.MathUtils.damp(r.widthMul, wGoal, 10, dt)
      // exclusive lines vanish completely when inactive; others ghost
      const floorOp = r.line.exclusive ? 0 : CONFIG.flowGhost
      const op = CONFIG.flowOpacity * THREE.MathUtils.lerp(floorOp, 1, r.fade)
      // clickable only while the route is actually showing (and not mid-focus)
      const pickable = !focusedKey && tabOn === 1
      if (r.pick && r.pick.visible !== pickable) r.pick.visible = pickable
      r.mats.forEach((m) => {
        m.opacity = op
        if (m.userData.widthUni) m.userData.widthUni.value = r.widthMul
        const s = m.userData.shader
        if (s) s.uniforms.uDashN.value = Math.max(3, m.userData.lineLen * CONFIG.flowDash)
      })
    }
  }

  /* ----------------------------------------------------------------------------
   CO₂ RINGS — pulsing arcs pushing outward from the EOR injection well at
   bottom-stratum depth (ported from the Omma build, re-anchored to the well).
---------------------------------------------------------------------------- */
  // Each emitter lives on one facility's cutaway. Look params (color, size,
  // speed…) are shared; placement (offsets, mask, aim) is per-emitter, mapped
  // to CONFIG keys so the settings panel + Lock Look capture everything.
  const RING_EMITTERS = [
    { key: 'eor', cfgOffX: 'ringOffX', cfgOffY: 'ringOffY', cfgOffZ: 'ringOffZ', cfgMaskTop: 'ringMaskTop', cfgTilt: 'ringTilt' },
    { key: 'sequestration', cfgOffX: 'seqOffX', cfgOffY: 'seqOffY', cfgOffZ: 'seqOffZ', cfgMaskTop: 'seqMaskTop', cfgTilt: 'seqTilt' },
  ]
  RING_EMITTERS.forEach((em) => {
    em.root = new THREE.Group()
    em.root.name = 'co2Rings_' + em.key
    em.setA = new THREE.Group()
    em.setB = new THREE.Group()
    em.root.add(em.setA, em.setB)
    em.meshes = []
    em.anchor = new THREE.Vector3()
    em.baseRadius = 4
    em.yBase = 0
    em.bottomBase = 0
    em.uniforms = {
      uBottom: { value: 0 }, // world Y where legs vanish
      uFadeH: { value: 0.4 }, // bottom fade band height
      uTop: { value: 1e9 }, // world Y where the mask crops the arcs
      uTopFadeH: { value: 0.8 }, // top fade band height
    }
  })
  const ringMeshes = [] // flat list across emitters (color updates etc.)

  function makeRingMaterial(em) {
    const mat = new THREE.MeshBasicMaterial({
      color: CONFIG.ringColor, transparent: true, opacity: 0,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    })
    mat.defines = { USE_UV: '' } // vUv.x = position along the arc (0..1, crown at 0.5)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uAge = { value: 0 }
      shader.uniforms.uBottom = em.uniforms.uBottom
      shader.uniforms.uFadeH = em.uniforms.uFadeH
      shader.uniforms.uTop = em.uniforms.uTop
      shader.uniforms.uTopFadeH = em.uniforms.uTopFadeH
      shader.vertexShader = ('varying float vWY;\n' + shader.vertexShader).replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;',
      )
      shader.fragmentShader = ('uniform float uAge;\nuniform float uBottom;\nuniform float uFadeH;\nuniform float uTop;\nuniform float uTopFadeH;\nvarying float vWY;\n' + shader.fragmentShader).replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      {
        float crown = 1.0 - abs(vUv.x - 0.5) * 2.0;               // 1 at top of arch
        float tips = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
        float ageCrown = 1.0 - crown * uAge * 0.95;               // crown dies first
        float bottom = smoothstep(uBottom, uBottom + uFadeH, vWY);
        float top = 1.0 - smoothstep(uTop - uTopFadeH, uTop, vWY); // crop above mask
        diffuseColor.a *= tips * ageCrown * bottom * top;
      }`,
      )
      mat.userData.shader = shader
    }
    return mat
  }

  function buildRings() {
    ringMeshes.forEach((m) => { m.geometry.dispose(); m.material.dispose() })
    ringMeshes.length = 0
    const ARC = Math.PI * 2 * 0.86 // near-full circle, gap at the very bottom
    for (const em of RING_EMITTERS) {
      em.meshes.length = 0
      em.setA.clear(); em.setB.clear()
      for (const set of [em.setA, em.setB]) {
        for (let i = 0; i < CONFIG.ringCount; i++) {
          const geo = new THREE.TorusGeometry(1, CONFIG.ringTube, 10, 96, ARC)
          geo.rotateZ(Math.PI / 2 - ARC / 2) // center the arch crown at local +Y
          const mesh = new THREE.Mesh(geo, makeRingMaterial(em))
          mesh.userData.isFxRing = true
          mesh.userData.phase = i / CONFIG.ringCount // stagger through the cycle
          mesh.castShadow = false; mesh.receiveShadow = false
          set.add(mesh)
          em.meshes.push(mesh)
          ringMeshes.push(mesh)
        }
      }
      em.root.visible = CONFIG.ringsOn
    }
  }

  // Orient one wavefront set flat against a cutaway wall: n = wall normal
  // (pointing out of the rock into the notch), crown up. Slightly proud of the
  // face so the strata relief never swallows it.
  function orientRingSet(set, n, pad) {
    const up = new THREE.Vector3(0, 1, 0)
    const x = new THREE.Vector3().crossVectors(up, n).normalize()
    set.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, n.clone().normalize()))
    set.userData.padVec = n.clone().normalize().multiplyScalar(pad)
    set.position.copy(set.userData.padVec)
  }

  function updateRingTransform() {
    for (const em of RING_EMITTERS) {
      em.root.position.set(
        em.anchor.x + CONFIG[em.cfgOffX],
        em.anchor.y + CONFIG[em.cfgOffY],
        em.anchor.z + CONFIG[em.cfgOffZ],
      )
      // "Aim" spins both wall sets around the pipe if the auto guess is off.
      em.root.rotation.set(0, THREE.MathUtils.degToRad(CONFIG[em.cfgTilt]), 0)
      // Rings must be BORN at the pipe. The X/Z offsets exist to tuck each wall's
      // arcs snugly against the rock, but they also drag the arc origin along the
      // wall — so cancel the along-wall component per set. Net effect: Offset X
      // only pushes the X-facing wall's arcs in/out, Offset Z the Z-facing one,
      // and both origins stay pinned to the injection pipe.
      if (em.setA.userData.padVec) {
        em.setA.position.copy(em.setA.userData.padVec).x -= CONFIG[em.cfgOffX]
        em.setB.position.copy(em.setB.userData.padVec).z -= CONFIG[em.cfgOffZ]
      }
    }
  }

  // Anchor each emitter at its facility's injection well: the WELLHEAD mesh
  // gives the pipe's X/Z (= the notch seam). The two inner cutaway walls meet
  // at that seam — one runs along X, one along Z, toward the side with more rock.
  function placeRings() {
    for (const em of RING_EMITTERS) {
      const f = facilities[em.key]
      if (!f) continue
      const box = f.box0
      const size = box.getSize(new THREE.Vector3())
      const well = wellheadMeshes.find(m => m.userData.facilityKey === em.key)
      const wp = new THREE.Vector3()
      if (well) new THREE.Box3().setFromObject(well).getCenter(wp)
      else box.getCenter(wp)
      const fx = (box.max.x - wp.x >= wp.x - box.min.x) ? 1 : -1 // rock side along X
      const fz = (box.max.z - wp.z >= wp.z - box.min.z) ? 1 : -1 // rock side along Z
      const world = new THREE.Vector3(wp.x, box.min.y + size.y * 0.09, wp.z)
      f.group.add(em.root) // rides lifts/moves with the tile
      f.group.updateMatrixWorld(true)
      em.anchor.copy(f.group.worldToLocal(world.clone()))
      em.baseRadius = Math.max(size.x, size.z) * 0.16
      em.yBase = world.y
      em.bottomBase = box.min.y + 0.03
      em.uniforms.uBottom.value = em.bottomBase // legs vanish at the block base
      em.uniforms.uFadeH.value = size.y * 0.05
      const pad = 0.35 // proud of the bumpy strata relief
      // Wall A faces the cavity along -fz·Z; wall B along -fx·X. Crowns point up.
      orientRingSet(em.setA, new THREE.Vector3(0, 0, -fz), pad)
      orientRingSet(em.setB, new THREE.Vector3(-fx, 0, 0), pad)
    }
    updateRingTransform()
  }

  function updateRings(t) {
    if (!ringMeshes.length) return
    for (const em of RING_EMITTERS) {
      const f = facilities[em.key]
      if (!f) continue
      // Rings hide with their tile (ghosted tiles shouldn't glow)
      const show = CONFIG.ringsOn && f.vis > 0.5
      if (em.root.visible !== show) em.root.visible = show
      if (!show) continue
      // Masks follow the emitter: Offset Y moves everything; Mask Top crops
      // relative to the emitter; tile lifts (pathway/hover) ride along too.
      const liftD = f.group.position.y - f.baseY
      em.uniforms.uBottom.value = em.bottomBase + liftD
      em.uniforms.uTop.value = em.yBase + CONFIG[em.cfgOffY] + CONFIG[em.cfgMaskTop] + liftD
      em.uniforms.uTopFadeH.value = CONFIG.ringMaskSoft
      const maxR = em.baseRadius * CONFIG.ringScale
      em.meshes.forEach((mesh) => {
        const local = ((t / CONFIG.ringPeriod) + mesh.userData.phase) % 1 // 0..1 life
        const r = 0.12 + local * maxR
        mesh.scale.set(r, r, 1)
        // Bright birth, steady travel, fade out over the last quarter of life
        mesh.material.opacity = CONFIG.ringOpacity
          * THREE.MathUtils.smoothstep(local, 0, 0.05)
          * (1 - THREE.MathUtils.smoothstep(local, 0.72, 1))
        const s = mesh.material.userData.shader
        if (s) s.uniforms.uAge.value = local // crown dies first as the ring ages
      })
    }
  }
  buildRings()

  /* ----------------------------------------------------------------------------
   3D NAMEPLATES — concept #4: a pill label lying on the ground at each tile's
   front corner, tilted with the iso grammar. Real scene geometry (canvas
   texture on a plane) so it occludes, parallaxes with the sway, rides tile
   lifts, and fades with ghosting. Every visual knob lives in settings.
---------------------------------------------------------------------------- */
  const LABELS = []
  // Plates live in their own scene, rendered AFTER the post-processing chain —
  // AO/shadow compositing can never darken them, and they stay pixel-crisp.
  const labelScene = new THREE.Scene()

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16)
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
  }

  function drawLabelCanvas(text) {
    const fs = CONFIG.lblFont, padX = CONFIG.lblPadX, padY = CONFIG.lblPadY
    const dot = 0 // bullets retired
    const margin = Math.ceil(Math.max(CONFIG.lblShBlur * 2 + Math.abs(CONFIG.lblShOffY) + 8, 24))
    const font = (CONFIG.lblItalic ? 'italic ' : '') + CONFIG.lblWeight + ' ' + fs
      + 'px ' + opts.fontFamily
    const probe = document.createElement('canvas').getContext('2d')
    probe.font = font
    const dotGap = dot ? dot + fs * 0.35 : 0
    const w = Math.ceil(probe.measureText(text).width + dotGap + padX * 2)
    const h = Math.ceil(fs + padY * 2)
    const c = document.createElement('canvas')
    c.width = w + margin * 2
    c.height = h + margin * 2
    const ctx = c.getContext('2d')
    ctx.font = font
    ctx.textBaseline = 'middle'
    const r = Math.min(CONFIG.lblRadius, h / 2)
    const pill = () => {
      ctx.beginPath()
      ctx.moveTo(margin + r, margin)
      ctx.lineTo(margin + w - r, margin)
      ctx.arcTo(margin + w, margin, margin + w, margin + r, r)
      ctx.lineTo(margin + w, margin + h - r)
      ctx.arcTo(margin + w, margin + h, margin + w - r, margin + h, r)
      ctx.lineTo(margin + r, margin + h)
      ctx.arcTo(margin, margin + h, margin, margin + h - r, r)
      ctx.lineTo(margin, margin + r)
      ctx.arcTo(margin, margin, margin + r, margin, r)
      ctx.closePath()
    }
    // drop shadow lifts the pill off the earth strata
    ctx.save()
    ctx.shadowColor = 'rgba(15,25,40,' + CONFIG.lblShOp + ')'
    ctx.shadowBlur = CONFIG.lblShBlur
    ctx.shadowOffsetY = CONFIG.lblShOffY
    ctx.fillStyle = hexToRgba(CONFIG.lblPillColor, CONFIG.lblPillOp)
    pill(); ctx.fill()
    ctx.restore()
    ctx.fillStyle = CONFIG.lblTextColor
    ctx.fillText(text, margin + padX + dotGap, c.height / 2 + fs * 0.04)
    return c
  }

  function setupLabels() {
    for (const [key, f] of Object.entries(facilities)) {
      const group = new THREE.Group()
      group.name = 'label_' + key
      const mat = new THREE.MeshBasicMaterial({
        transparent: true, opacity: 1, depthWrite: false, toneMapped: false,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
      mesh.userData.isFxRing = true // exempt from ghost/AO/shadow passes
      mesh.castShadow = false; mesh.receiveShadow = false
      mesh.renderOrder = 5
      group.add(mesh)
      // Anchor: the tile's camera-facing ground corner (box.max.x, box.min.z).
      // Plates live in WORLD space — parenting them into the facility node
      // inherits that node's GLB rotation/scale and spins the plate out of view
      // (the drilling rig's node does exactly that). Lift is tracked manually.
      const anchor = new THREE.Vector3(f.box0.max.x, f.box0.min.y, f.box0.min.z)
      group.userData.anchor = anchor
      labelScene.add(group)
      LABELS.push({ key, f, group, mesh, mat, tex: null, fade: 1 })
    }
    applyLabelStyle()
    // Inter may land after first paint — redraw once real glyphs are available
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!disposed) applyLabelStyle() })
    console.log('[explorer] labels:', LABELS.length)
  }

  function applyLabelStyle() {
    for (const L of LABELS) {
      const canvas = drawLabelCanvas(FACILITY_DEFS[L.key] ? FACILITY_DEFS[L.key].label : L.key)
      if (L.tex) L.tex.dispose()
      L.tex = new THREE.CanvasTexture(canvas)
      L.tex.colorSpace = THREE.SRGBColorSpace
      L.tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      L.mat.map = L.tex
      L.mat.needsUpdate = true
      const worldH = CONFIG.lblSize
      L.bw = worldH * canvas.width / canvas.height
      L.bh = worldH
      L.mesh.scale.set(L.bw, L.bh, 1) // per-frame focus shrink rides on top
      // Plate-frame offsets: n = facing direction (away from the wall),
      // t = along the plate (the direction the text reads).
      const yawRad = THREE.MathUtils.degToRad(CONFIG.lblYaw)
      const nx = Math.sin(yawRad), nz = Math.cos(yawRad)
      const tx = Math.cos(yawRad), tz = -Math.sin(yawRad)
      const a = L.group.userData.anchor
      L.group.position.set(
        a.x + CONFIG.lblAlong * tx + CONFIG.lblAway * nx,
        a.y + CONFIG.lblHeight,
        a.z + CONFIG.lblAlong * tz + CONFIG.lblAway * nz,
      )
      L.group.rotation.set(0, yawRad, 0)
      L.mesh.rotation.set(-Math.PI / 2 + THREE.MathUtils.degToRad(CONFIG.lblTilt), 0, 0)
      L.group.visible = CONFIG.lblOn
    }
  }

  function updateLabels(dt) {
    if (!LABELS.length) return
    for (const L of LABELS) {
      if (L.group.visible !== CONFIG.lblOn) L.group.visible = CONFIG.lblOn
      if (!CONFIG.lblOn) continue
      // ride the tile's lift/hover bounce (labels live in world space)
      L.group.position.y = L.group.userData.anchor.y + CONFIG.lblHeight + (L.f.group.position.y - L.f.baseY)
      let goal
      if (hotspotActive) goal = 0 // clean close-ups
      else if (focusedKey === L.key) goal = 1 // stays up in the close view
      else if (hoveredKey === L.key && L.f.visGoal > 0.5) goal = 1 // hover reveals — but never on ghosted tiles
      else goal = THREE.MathUtils.lerp(CONFIG.lblGhost, 1, L.f.vis) // always visible (hover-only retired)
      L.fade = THREE.MathUtils.damp(L.fade, goal, 8, dt)
      L.mat.opacity = L.fade
      // shrink ALL plates during any focus — the camera zoom is global, so the
      // ghosted neighbors need the same compensation as the star of the shot
      L.focusBlend = THREE.MathUtils.damp(L.focusBlend || 0, focusedKey ? 1 : 0, 6, dt)
      const s = THREE.MathUtils.lerp(1, CONFIG.lblFocusScale, L.focusBlend)
      if (L.bw) L.mesh.scale.set(L.bw * s, L.bh * s, 1)
    }
  }

  /* ----------------------------------------------------------------------------
   CALLOUT CHIP — one floating one-liner reused by DAC part clicks and
   flow-line inspection. Auto-hides after CONFIG.calloutSecs.
---------------------------------------------------------------------------- */
  const calloutChip = $id('calloutChip')
  let calloutTimer = 0

  // eslint-disable-next-line no-unused-vars -- callout chips are retired but the machinery stays wired
  function showCallout(clientX, clientY, text) {
    const r = wrap.getBoundingClientRect()
    calloutChip.textContent = text
    calloutChip.style.left = Math.min(Math.max(clientX - r.left, 20), r.width - 20) + 'px'
    calloutChip.style.top = Math.max(clientY - r.top - 16, 14) + 'px'
    calloutChip.classList.add('on')
    clearTimeout(calloutTimer)
    calloutTimer = setTimeout(() => calloutChip.classList.remove('on'), CONFIG.calloutSecs * 1000)
  }
  function hideCallout() {
    clearTimeout(calloutTimer)
    calloutChip.classList.remove('on')
  }

  // Part panels for the DAC close-up (hover glow → click to learn). Short copy
  // on purpose; titles follow the real DAC process chain (contactor → pellet
  // reactor → calciner).
  const PART_COPY = {
    air1: { title: 'Air Contactor', body: 'Fans pull ambient air across a CO₂-binding solution — the first step of capture.' },
    air2: { title: 'Air Contactor', body: 'Fans pull ambient air across a CO₂-binding solution — the first step of capture.' },
    tower: { title: 'Calciner', body: 'Heats the captured carbonate to release a pure stream of CO₂, ready for compression and storage.' },
    pellet: { title: 'Pellet Reactor', body: 'Binds the captured CO₂ into small carbonate pellets that feed the calciner.' },
    fan: { title: 'Air Contactor', body: 'Fans pull ambient air across a CO₂-binding solution — the first step of capture.' }, // fans present as the contactor (reviewed copy)
    // EOR — CO₂ flood surface facility
    eorwell: { title: 'Injection Well', body: 'Sends dense-phase CO₂ deep into the reservoir, sweeping oil the primary phase left behind.' },
    eortowers: { title: 'Processing Towers', body: 'Strips CO₂ and gas liquids from the produced stream so the CO₂ can be recycled downhole.' },
    eorsep: { title: 'Separation Facility', body: 'Uses three-phase separators to split production into oil, water and CO₂-rich gas.' },
    eorcomp: { title: 'Gas Plant and Compression', body: 'Treats the CO₂-rich gas and compresses it back to injection pressure for reuse.' },
    // Water Management — produced-water treatment loop
    watclar: { title: 'Clarifiers', body: 'Slow-turning skimmers settle solids out of produced water — the first stage of treatment.' },
    watchem: { title: 'Chemical Treatment', body: 'Dosing silos and mix tanks condition the water so contaminants drop out cleanly.' },
    wattanks: { title: 'Storage and Recycle Tanks', body: 'Treated water is held here before heading back out to operations for reuse.' },
    // Sequestration — permanent CO₂ storage site
    seqwell: { title: 'Injection Wellhead', body: 'Controls the flow of CO₂ into the storage formation below.' },
    seqpack: { title: 'CO₂ Receiving and Metering', body: 'Incoming CO₂ from the pipeline is filtered, measured and staged here for injection.' },
    seqhut: { title: 'Monitoring Station', body: 'Instruments track pressure and verify the CO₂ stays exactly where it was put.' },
  }
  // The sequestration dot no longer changes the camera — it opens this story
  // about what's happening under the tile.
  const SEQ_DOT_COPY = {
    title: 'Permanent Storage',
    body: 'Injected CO₂ is stored in porous rock more than a mile down, where layers of impermeable caprock seal it in place.',
  }
  function partCopyFor(pk) {
    if (!pk) return null
    return PART_COPY[pk] || (pk.startsWith('fan:') ? PART_COPY.fan : null)
  }

  // Small glass panel (same frosted treatment as the main panel) anchored to the
  // 3D point the user clicked — it re-projects every frame, so it rides the
  // camera sway like it lives on the part. Persists until a click elsewhere.
  const partPanel = $id('partPanel')
  const partPanelWorld = new THREE.Vector3()

  function showPartPanel(worldPoint, title, body) {
    partPanelWorld.copy(worldPoint)
    partPanel.innerHTML = ''
    const h = document.createElement('h5')
    h.textContent = title
    const p = document.createElement('p')
    p.textContent = body
    partPanel.append(h, p)
    partPanel.classList.add('on')
    updatePartPanel()
  }
  function hidePartPanel() {
    partPanel.classList.remove('on')
  }
  function updatePartPanel() {
    if (!partPanel.classList.contains('on')) return
    const v = partPanelWorld.clone().project(camera)
    const sx = (v.x * 0.5 + 0.5) * wrap.clientWidth
    const sy = (-v.y * 0.5 + 0.5) * wrap.clientHeight
    const w = partPanel.offsetWidth || 280
    let x = sx + 26
    if (x + w > wrap.clientWidth - 12) x = sx - w - 26 // flip to the left side
    const y = Math.min(Math.max(sy - 44, 12), wrap.clientHeight - 170)
    partPanel.style.left = x + 'px'
    partPanel.style.top = y + 'px'
  }

  /* ----------------------------------------------------------------------------
   BREADCRUMBS — Overview › Tab › Facility › Close-up. Each crumb steps OUT
   one level instead of resetting to wide.
---------------------------------------------------------------------------- */
  const crumbsEl = $id('crumbs')

  function renderCrumbs() {
    if (!crumbsEl) return
    const items = [{ label: 'Overview', act: () => {
      tabButtons.forEach(b => b.classList.remove('active'))
      setPathway(null)
    } }]
    if (activePathway && PATHWAYS[activePathway]) {
      items.push({ label: PATHWAYS[activePathway].title, act: () => setPathway(activePathway) })
    }
    if (focusedKey && facilities[focusedKey]) {
      const k = focusedKey
      items.push({ label: facilities[k].label, act: () => focusFacility(k) }) // exits a close-up back to the facility
    }
    if (hotspotActive) items.push({ label: 'Close-up', act: null })
    crumbsEl.innerHTML = ''
    if (items.length === 1) { crumbsEl.classList.remove('on'); return }
    items.forEach((it, i) => {
      const last = i === items.length - 1
      const el = document.createElement(last ? 'span' : 'button')
      el.className = 'pc-item' + (last ? ' here' : '')
      el.textContent = it.label
      if (!last && it.act) el.addEventListener('click', () => { cancelTour('crumb'); it.act() })
      crumbsEl.appendChild(el)
      if (!last) {
        const s = document.createElement('span')
        s.className = 'pc-sep'
        s.textContent = '›'
        crumbsEl.appendChild(s)
      }
    })
    crumbsEl.classList.add('on')
    viewerHint.classList.add('faded') // instructions have served their purpose
  }
  // Return arrow in the panel corner — straight back to the wide overview.
  const panelReturn = $id('panelReturn')
  if (panelReturn) panelReturn.addEventListener('click', (e) => {
    e.stopPropagation()
    cancelTour('return')
    tabButtons.forEach(b => b.classList.remove('active'))
    setPathway(null)
  })

  /* ----------------------------------------------------------------------------
   STORY TOUR — "Play the story": auto-hops the active pathway's facilities in
   order, dwelling CONFIG.tourDwell seconds each, then eases back out to the
   pathway view. Any real interaction cancels it.
---------------------------------------------------------------------------- */
  const tourBtn = $id('tourBtn')
  let tourActive = false, tourIdx = -1, tourNextAt = -1

  function startTour() {
    if (!activePathway || !PATHWAYS[activePathway]) return
    clearFlowSelect()
    hideCallout()
    tourActive = true
    tourIdx = -1
    tourNextAt = -1 // advance on the next frame
    tourBtn.classList.add('playing')
    tourBtn.innerHTML = '◼&nbsp;&nbsp;Stop tour'
  }
  function cancelTour() {
    if (!tourActive) return
    tourActive = false
    tourBtn.classList.remove('playing')
    tourBtn.innerHTML = '▶&nbsp;&nbsp;Play the story'
  }
  function updateTour(t) {
    if (!tourActive) return
    if (tourNextAt >= 0 && t < tourNextAt) return
    const pw = PATHWAYS[activePathway]
    if (!pw) { cancelTour(); return }
    tourIdx++
    if (tourIdx >= pw.facilities.length) {
      cancelTour()
      setPathway(activePathway) // ease back out to the pathway view
      return
    }
    focusFacility(pw.facilities[tourIdx])
    tourNextAt = t + CONFIG.tourDwell
  }
  if (tourBtn) tourBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (tourActive) cancelTour(); else startTour()
  })
  canvas.addEventListener('pointerdown', () => cancelTour('grab'))

  /* ----------------------------------------------------------------------------
   TABS
---------------------------------------------------------------------------- */
  const tabButtons = hostEl.querySelectorAll('.tab-btn')
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.tab
      if (activePathway === key) {
        btn.classList.remove('active')
        setPathway(null)
        return
      }
      tabButtons.forEach(b => b.classList.toggle('active', b === btn))
      setPathway(key)
    })
  })

  /* ----------------------------------------------------------------------------
   RESIZE
---------------------------------------------------------------------------- */
  on(window, 'resize', () => {
    measureHeader()
    renderer.setSize(wrap.clientWidth, wrap.clientHeight)
    if (composer) composer.setSize(wrap.clientWidth, wrap.clientHeight)
    if (sharpenPass) sharpenPass.uniforms.resolution.value.set(wrap.clientWidth, wrap.clientHeight)
    if (sceneBox) rig.frustumFit = fitFrustum(sceneBox)
    applyPanelPos() // viewport-scaled offsets track the new window size
    applyHeaderBar()
  })

  /* ----------------------------------------------------------------------------
   LOOK — the handoff build's tuning drawer is not part of this port, so the
   drawer's side effects are applied here from CONFIG (already merged with
   BAKED_LOOK). Everything constructed above read CONFIG directly; this covers
   the state that lived outside CONFIG (uniforms, DOM panels, AO material).
---------------------------------------------------------------------------- */
  const TONE_MAPS = [THREE.NoToneMapping, THREE.LinearToneMapping, THREE.ReinhardToneMapping, THREE.CineonToneMapping, THREE.ACESFilmicToneMapping, THREE.NeutralToneMapping, THREE.AgXToneMapping]
  const refreshMats = () => scene.traverse((o) => {
    if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m && (m.needsUpdate = true))
  })

  // Info panel position — reference-viewport px scaled to the live canvas
  function applyPanelPos() {
    infoStack.style.left = Math.round(CONFIG.panelX * refSX()) + 'px'
    infoStack.style.bottom = Math.round(CONFIG.panelY * refSY()) + 'px'
    infoStack.style.width = Math.round(CONFIG.panelW) + 'px'
  }

  // Info panel frosted glass (shell + the floating part panel)
  function applyPanelGlass() {
    const bg = `rgba(255,255,255,${CONFIG.glassAlpha})`
    const filter = `blur(${CONFIG.glassBlur}px) saturate(${CONFIG.glassSat})`
    for (const el of [infoPanel, partPanel]) {
      el.style.background = bg
      el.style.backdropFilter = filter
      el.style.webkitBackdropFilter = filter
    }
  }

  // Info panel drop shadow
  function applyPanelShadow() {
    const c = new THREE.Color(CONFIG.pshColor)
    const shadow
      = `${CONFIG.pshX}px ${CONFIG.pshY}px ${CONFIG.pshBlur}px `
        + `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${CONFIG.pshOpacity})`
    infoPanel.style.boxShadow = shadow
  }
  function nudgeHighlight() { for (const f of Object.values(facilities)) f.vis += 0.001 } // force re-apply

  // Header bar (strip behind title/tabs)
  const headerBar = $id('headerBar')
  function applyHeaderBar() {
    const rgba = (hex, a) => {
      const c = new THREE.Color(hex)
      return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`
    }
    headerBar.style.height = Math.round(CONFIG.hbHeight * refSY()) + 'px'
    headerBar.style.display = CONFIG.hbHeight > 0 ? 'block' : 'none'
    headerBar.style.background = CONFIG.hbGrad
      ? `linear-gradient(to bottom, ${rgba(CONFIG.hbColor, CONFIG.hbAlpha)} 0%, ${rgba(CONFIG.hbColor2, CONFIG.hbAlpha2)} 100%)`
      : rgba(CONFIG.hbColor, CONFIG.hbAlpha)
  }

  function refreshAO() {
    if (!gtaoPass) return
    gtaoPass.updateGtaoMaterial({
      radius: CONFIG.aoRadius, distanceExponent: CONFIG.aoDistExp, thickness: CONFIG.aoThickness,
      scale: CONFIG.aoScale, samples: 16, distanceFallOff: 1, screenSpaceRadius: false,
    })
  }

  function applyBakedLook() {
    renderer.toneMapping = TONE_MAPS[CONFIG.toneMap] ?? THREE.NeutralToneMapping
    renderer.toneMappingExposure = CONFIG.exposure
    sun.color.set(CONFIG.sunColor)
    flowShared.uDuty.value = 1 - CONFIG.flowGap
    waterUni.uWAmp.value = CONFIG.waterAmp
    waterUni.uWSwell.value = CONFIG.waterSwell
    waterUni.uWScale.value = CONFIG.waterScale
    waterUni.uWWarp.value = CONFIG.waterWarp
    dacAdj.uAdjExp.value = CONFIG.dmExp
    dacAdj.uAdjBright.value = CONFIG.dmBright
    dacAdj.uAdjGamma.value = CONFIG.dmGamma
    refreshAO()
    applyPanelPos()
    applyPanelGlass()
    applyPanelShadow()
    applyHeaderBar()
    applyHotspotStyle()
    refreshMats()
  }
  applyBakedLook()
  console.log('[explorer] baked look applied')

  canvas.style.cursor = CONFIG.dragOn ? 'grab' : 'default'

  /* ----------------------------------------------------------------------------
   MAIN LOOP
---------------------------------------------------------------------------- */
  let lastT = performance.now()
  let fpsAcc = 0, fpsN = 0, fpsTimer = 0

  renderer.setAnimationLoop(() => {
    const now = performance.now()
    const dt = Math.min((now - lastT) / 1000, 0.05)
    lastT = now
    const t = now / 1000

    if (CONFIG.spinSun) {
      CONFIG.sunAzimuth = (CONFIG.sunAzimuth + CONFIG.spinSunSpeed * dt) % 360
      fitSun()
    }
    updateRig(dt, t)
    updateHighlight(dt)
    updateHover()
    updateFlag(t)
    updateRings(t)
    updateFans(dt)
    updateDacParts(dt)
    updateAirLines(t, dt)
    updateFlowLines(t, dt)
    updateHotspot()
    updateTour(t)
    updateLabels(dt)
    updatePartPanel()
    updateDebugHud()
    waterUni.uWTime.value = t * CONFIG.waterSpeed
    if (waterEnvDirty) {
      waterEnvDirty = false
      const oldEnv = waterEnv
      waterEnv = makeWaterEnv()
      for (const m of waterMats) { m.envMap = waterEnv; m.needsUpdate = true }
      if (oldEnv) oldEnv.dispose()
    }

    if (CONFIG.ppEnabled && composerOK) composer.render()
    else renderer.render(scene, camera)
    if (LABELS.length && CONFIG.lblOn) { // nameplate overlay — always above the composite
      renderer.autoClear = false
      renderer.clearDepth()
      renderer.render(labelScene, camera)
      renderer.autoClear = true
    }

    if (CONFIG.showFps && fpsMeter) {
      fpsAcc += 1 / Math.max(dt, 1e-4); fpsN++; fpsTimer += dt
      if (fpsTimer > 0.5) { fpsMeter.textContent = Math.round(fpsAcc / fpsN) + ' fps'; fpsAcc = 0; fpsN = 0; fpsTimer = 0 }
    }
  })

  /* ----------------------------------------------------------------------------
   DEBUG HUD — open the app with ?debug in the URL to see the live camera
   math on-screen (for cross-machine framing diagnosis). No-op otherwise.
---------------------------------------------------------------------------- */
  let _dbgEl = null, _dbgTick = 0
  function updateDebugHud() {
    if (!/[?&]debug/.test(location.search)) return
    if ((_dbgTick = (_dbgTick + 1) % 15) !== 0) return // 4x/sec
    if (!_dbgEl) {
      _dbgEl = document.createElement('div')
      _dbgEl.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99999;background:rgba(10,16,28,0.88);color:#9fe3a1;font:11px/1.6 Menlo,monospace;padding:10px 13px;border-radius:8px;white-space:pre;pointer-events:none;'
      document.body.appendChild(_dbgEl)
    }
    let sceneW = '-'
    if (sceneBox) {
      let mn = Infinity, mx = -Infinity
      for (const x of [sceneBox.min.x, sceneBox.max.x]) for (const y of [sceneBox.min.y, sceneBox.max.y]) for (const z of [sceneBox.min.z, sceneBox.max.z]) {
        const v = new THREE.Vector3(x, y, z).project(camera)
        mn = Math.min(mn, v.x); mx = Math.max(mx, v.x)
      }
      sceneW = Math.round(((mx - mn) / 2) * 100) + '%'
    }
    const hDef = Math.min(Math.max(1200 / Math.max(1, wrap.clientHeight) - 1, 0), 1)
    _dbgEl.textContent
      = 'build   ' + BUILD_TAG + '\n'
        + 'window  ' + window.innerWidth + 'x' + window.innerHeight + '  wrap ' + wrap.clientWidth + 'x' + wrap.clientHeight + '\n'
        + 'header  ' + Math.round(headerPx) + 'px  eff ' + Math.round(effHeaderPx()) + 'px  (cap ' + CONFIG.headerMaxFrac + ')\n'
        + 'hComp   ' + (wrap.clientHeight / Math.max(1, wrap.clientHeight - effHeaderPx())).toFixed(3) + '\n'
        + 'deficit ' + hDef.toFixed(3) + '  boost x' + (1 + CONFIG.fitBoost * hDef).toFixed(3) + '  (fitBoost ' + CONFIG.fitBoost + ')\n'
        + 'fit     ' + rig.frustumFit.toFixed(2) + '  zoom ' + rig.zoom.toFixed(3) + ' -> goal ' + rig.zoomGoal.toFixed(3) + '\n'
        + 'sceneW  ' + sceneW + ' of window width'
  }

  /* ----------------------------------------------------------------------------
   DISPOSE — called when the host component unmounts
---------------------------------------------------------------------------- */
  function disposeObject3D(obj) {
    obj.traverse((o) => {
      if (!o.isMesh) return
      if (o.geometry) o.geometry.dispose()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m) continue
        for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture) v.dispose() }
        m.dispose()
      }
    })
  }

  function dispose() {
    if (disposed) return
    disposed = true
    renderer.setAnimationLoop(null)
    cancelTour('dispose')
    for (const [target, type, fn, o] of listeners) target.removeEventListener(type, fn, o)
    listeners.length = 0
    for (const id of timers) clearTimeout(id)
    timers.clear()
    clearTimeout(calloutTimer)
    if (_dbgEl) { _dbgEl.remove(); _dbgEl = null }
    disposeObject3D(scene)
    disposeObject3D(labelScene)
    for (const L of LABELS) if (L.tex) L.tex.dispose()
    if (waterEnv) waterEnv.dispose()
    if (scene.environment) scene.environment.dispose()
    pmrem.dispose()
    if (composer) {
      for (const p of composer.passes) if (p.dispose) p.dispose()
      composer.dispose()
    }
    dracoLoader.dispose()
    renderer.dispose()
    if (renderer.forceContextLoss) renderer.forceContextLoss()
  }

  return { dispose, setPathway, focusFacility, resetFocus, CONFIG }
}
