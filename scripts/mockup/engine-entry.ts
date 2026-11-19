/**
 * Bundle of the real DStudio renderer for the HTML mockup (docs/maquette).
 * Built by scripts/build-mockup.mjs into a global `window.DStudio`.
 */
export { TEAM_BRAND, TEAM_PRESETS, brandPalette } from '@/brand/brand';
export { FONTS } from '@/engine/fonts';
export { FORMATS, getFormat, previewSize } from '@/engine/formats';
export { LOGO_MOTIONS, LOGO_PLACEMENTS } from '@/engine/logo';
export { drawSafeZones } from '@/engine/safeZones';
export { formatTimecode } from '@/engine/timing';
export { planExport } from '@/export/plan';
export { EDITING_APPS, backgroundNote, getEditingApp } from '@/export/targets';
export { createProject, projectTitle, projectTotalDuration } from '@/project/project';
export { renderProjectFrame } from '@/project/renderProject';
export { TEMPLATES, getTemplate } from '@/templates/registry';
