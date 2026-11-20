import { expect, test } from '@playwright/test';

/**
 * Visual non-regression: each template is drawn at fixed instants and compared with the
 * reference images in e2e/__screenshots__. If a change is intended, refresh them with
 * `npm run test:e2e:update` and review the new images before committing.
 */
const TEMPLATES = [
  'intro',
  'chapter',
  'lower-third',
  'chapter-series',
  'playing-card',
  'lower-third-batch',
  'end-card',
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(
    () => 'renderFrame' in ((window as never as { __dstudio?: object }).__dstudio ?? {}),
  );
});

async function frame(page: import('@playwright/test').Page, req: Record<string, unknown>) {
  const dataUrl = await page.evaluate(
    (r) =>
      (window as never as { __dstudio: { renderFrame(r: unknown): Promise<string> } }).__dstudio.renderFrame(
        r,
      ),
    req,
  );
  return Buffer.from(dataUrl.split(',')[1]!, 'base64');
}

for (const templateId of TEMPLATES) {
  test(`${templateId} — held frame, 16:9`, async ({ page }) => {
    expect(await frame(page, { templateId, time: 2 })).toMatchSnapshot(`${templateId}-16x9-hold.png`);
  });
  test(`${templateId} — mid-entrance, 9:16`, async ({ page }) => {
    expect(await frame(page, { templateId, time: 0.45, format: '9:16' })).toMatchSnapshot(
      `${templateId}-9x16-entrance.png`,
    );
  });
}

const VARIANTS: [string, string, number][] = [
  ['lower-third', 'editorial-white', 2],
  ['lower-third', 'rose-signature', 2],
  ['playing-card', 'ivoire-boardgame', 2.5],
  ['playing-card', 'neon-arcade', 2.5],
  ['playing-card', 'minimal-bmc', 2.5],
  ['playing-card', 'solid-color', 2.5],
];
for (const [templateId, variant, time] of VARIANTS) {
  test(`${templateId} — ${variant}`, async ({ page }) => {
    expect(await frame(page, { templateId, time, variant })).toMatchSnapshot(`${templateId}-${variant}.png`);
  });
}

// Card backs, seen face down at the start of "Zoom & intertitre" (with a stand-in logo).
for (const back of ['geometric', 'solid-logo', 'minimal']) {
  test(`playing-card — back ${back}`, async ({ page }) => {
    expect(
      await frame(page, { templateId: 'playing-card', time: 0.3, content: { back }, withLogo: true }),
    ).toMatchSnapshot(`playing-card-back-${back}.png`);
  });
}

const ANIMATIONS: [string, string][] = [
  ['intro', 'kinetic-impact'],
  ['intro', 'editorial-card'],
  ['chapter', 'marker-highlight'],
  ['chapter', 'framed-box'],
  ['lower-third', 'elastic-pop'],
  ['playing-card', 'fan-snap'],
  ['playing-card', 'card-flip-3d'],
];
for (const [templateId, animation] of ANIMATIONS) {
  test(`${templateId} — animation ${animation}`, async ({ page }) => {
    expect(await frame(page, { templateId, time: 1.6, animation })).toMatchSnapshot(
      `${templateId}-${animation}.png`,
    );
  });
}
