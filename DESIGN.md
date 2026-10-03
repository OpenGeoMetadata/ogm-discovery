---
version: alpha
name: OpenGeoMetadata Viewer
description: A lightweight, map-first design system for a configurable geospatial discovery frontend that can be branded by institutions and deployed as a static site.
colors:
  primary: '#111111'
  secondary: '#0057B8'
  tertiary: '#D52B1E'
  neutral: '#F6F0D8'
  surface: '#FFFDF3'
  surface-subtle: '#F6D94D'
  on-surface: '#141414'
  muted: '#5A5547'
  border: '#1E1E1E'
  success: '#0F766E'
  warning: '#B45309'
  error: '#B91C1C'
  on-primary: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Work Sans
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0
  headline-md:
    fontFamily: Work Sans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  '2xl': 48px
  gutter: 24px
  content-max: 1280px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    padding: 12px
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.md}'
    padding: 12px
  card-default:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 24px
  chip-filter:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.on-surface}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 8px
  search-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.md}'
    height: 48px
---

# OpenGeoMetadata Viewer Design System

## Overview

This interface should feel like trustworthy public infrastructure for geospatial discovery: calm, clear, institutional, and map-aware. It is not a flashy SaaS dashboard and it is not a marketing microsite. The visual tone should support libraries, archives, and small campus teams that need a serious discovery surface they can brand and launch with minimal engineering overhead.

The design system must also stay configurable. Institutions should be able to change accent colors, logos, and selected content areas without forcing a layout fork or a total rewrite. BTAA remains the reference implementation, but the default visual language should be broad enough to fit a single campus site just as comfortably as a consortium portal.

Institution pilots may also introduce official web typography, utility navigation bands, hero photography overlays, and photo-backed footers when those treatments come from theme configuration rather than bespoke component forks. The map and search experience should still remain the product center of gravity.

## Colors

The default OpenGeoMetadata theme uses a Bauhaus-inspired starter palette:
black structure, warm paper, and disciplined red, blue, and yellow accents.
This should feel geometric and instructional without turning the discovery
interface into a poster.

- **Primary (#111111):** The structural anchor. Use it for site lockups, primary actions, strong dividers, and trusted navigation surfaces.
- **Secondary (#0057B8):** Interaction blue for focus rings, active states, selected filters, and links that need more energy than the primary color alone.
- **Tertiary (#D52B1E):** A direct red accent for hero panels, editorial highlights, collection spotlights, and occasional supporting emphasis. Do not let it overtake the core product chrome.
- **Neutral (#F6F0D8):** The warm page foundation. It should keep the interface bright, legible, and clearly distinct from institution-specific examples.
- **Surface (#FFFDF3):** The primary card and panel surface.
- **Surface-Subtle (#F6D94D):** A yellow accent surface for small moments of emphasis. Use sparingly in dense research views.
- **On-Surface (#141414):** Default text color. Strong enough for dense metadata and table content.
- **Muted (#5A5547):** Supporting metadata, labels, and quiet UI.
- **Border (#1E1E1E):** Primary border and divider color. Use strong lines carefully to organize information without making the UI feel heavy.

Institution-specific themes may swap the brand colors, but the role structure should remain stable: one anchor brand color, one energetic interactive accent, and a predominantly neutral reading environment. BTAA and other institutional examples can remain calmer than the starter theme when their brand systems call for it.

## Typography

Typography should be dependable, compact, and highly readable. The default voice is a modern institutional sans serif with clear hierarchy and enough warmth to keep the interface from feeling bureaucratic.

- **Headlines:** Strong and compact. Use bold or semibold weights for page headings, collection spotlights, and major section titles. Headlines should feel authoritative, not decorative.
- **Body:** Regular weight at 16px should remain the default for descriptions, resource context, and long metadata-adjacent copy.
- **Labels:** Slightly tighter, semibold, and small. Use for filter labels, metadata headers, compact UI headings, and controls.

Typography must tolerate localization and metadata density. Avoid fragile line-length assumptions, over-tight containers, and text treatments that break when labels expand.

## Layout

The layout should feel map-first and search-first at the same time. The map is not decoration, but it also should not crowd out resource titles, filters, or metadata. Users need to understand scope quickly, refine quickly, and inspect records without losing their place.

- Use a fluid mobile layout and a fixed max-width desktop layout.
- Follow a disciplined spacing rhythm with 8px-derived increments and 24px gutters on larger layouts.
- Keep the search bar prominent near the top of the experience.
- Let results, facets, and maps coexist without making any one panel feel cramped or incidental.
- Favor clear containment: cards, panels, section bands, and map frames should organize information visibly.
- On home pages, the hero, featured collections, and supporting editorial modules should support discovery rather than distract from it.

When in doubt, choose clarity over novelty and scanning speed over visual density tricks.

## Elevation & Depth

Depth should come from tonal contrast, panel grouping, and border structure rather than dramatic shadow. This is a research interface; it should feel steady and composed.

- Use light tonal separation between page background and content surfaces.
- Use borders and subtle background shifts for hierarchy.
- Reserve shadows for overlays, dialogs, and rare floating controls.
- Keep sticky headers and map controls visually present but not dominant.

## Shapes

The shape language should be soft enough to feel contemporary but restrained enough to feel institutional.

- Standard controls use modest rounded corners.
- Larger cards and panels can be slightly rounder than buttons and inputs.
- Filter chips and pill controls may use full rounding.
- Avoid mixing rigid sharp corners with highly rounded consumer-style shapes in the same view.

The overall impression should be sturdy, quiet, and intentionally understated.

## Components

- **Header:** The institutional lockup is the brand anchor. It should coexist with search without making the page feel top-heavy. Navigation should stay compact and utility-oriented.
- Institutions may use a two-tier header pattern when it reflects their web system: a slim utility row for campus-level links and a primary row that keeps the geo search front and center.
- A sitewide notice banner may sit above the header when it is configured by the active theme. Strong neon treatment should be reserved for temporary experimental or critical notices, and the text must remain readable, localized, and dismissing-free unless persistence is added deliberately.
- **Search Field:** This is a primary action surface, not a tiny utility input. It should feel inviting, fast, and reliable, with strong focus states and enough height for comfortable use on mobile.
- **Facet Controls and Chips:** Filters should read as tools for narrowing a catalog, not as playful tags. Use calm backgrounds, visible selection states, and generous hit areas.
- **Result Cards and Lists:** Lead with title, resource type, institution, and thumbnail when available. Metadata should support the title, not compete with it.
- **Maps:** Default to the standard OpenStreetMap basemap, matching the BTAA Geoportal, with visible attribution. Leaflet maps may also offer Esri World Imagery. Base maps, hex maps, and overlays should stay visually calm. The cartographic layer should help orientation and discovery, not overwhelm the surrounding UI. Empty, loading, and no-geometry states should remain legible and useful.
- **Resource previews:** OGM Viewer owns the map/image tabs, layer controls, fullscreen mode, and feature inspection within the existing resource preview frame. Use its light theme to match the page, hide its duplicate record title, and keep the frame full-width at 600px high. Discovery and homepage maps retain their existing presentation.
- **Metadata Tables:** Favor alignment, consistent label treatment, and easy copyability. Dense detail is acceptable if it stays well grouped.
- **Footer:** The footer is a utility space for partner links, help, policies, localization, and optional theme switching. It should feel structured and dependable rather than promotional.
- A branded footer may use photography or a stronger atmospheric treatment if the information hierarchy stays clear and text contrast remains solid.
- **Motion:** Use brief, meaningful motion for reveals, loading transitions, and map-related context shifts. Avoid decorative animation loops or exaggerated easing.

## Do's and Don'ts

- Do keep the interface calm, readable, and map-aware.
- Do let institutions brand the product through theme variables and content slots rather than custom layout forks.
- Do maintain WCAG AA contrast for text and controls.
- Do design for translated labels, longer institution names, and sparse-content states.
- Do keep the most important action visually obvious on every screen.
- Don't drift into generic purple SaaS styling, glossy gradients, or playful dashboard tropes.
- Don't make the homepage feel like a marketing site before it feels like a discovery tool.
- Don't hardcode BTAA-specific visual language into shared components.
- Don't use heavy shadows, glassmorphism, or motion that competes with search and map work.
- Don't let the map overpower the metadata, or the metadata bury the map.
