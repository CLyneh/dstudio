import { expect, test } from '@playwright/test';

/** Real exports through ffmpeg.wasm: checks each format produces a valid file. */
type ExportInfo = { fileName: string; size: number; head: number[]; type: string };

// One at a time: encoders are CPU-heavy and would starve each other in parallel.
test.describe.configure({ mode: 'serial', timeout: 360_000 });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(
    () => 'exportFile' in ((window as never as { __dstudio?: object }).__dstudio ?? {}),
  );
});

function exportFile(
  page: import('@playwright/test').Page,
  templateId: string,
  app: string,
  background: string,
) {
  return page.evaluate(
    ([t, a, b]) =>
      (
        window as never as { __dstudio: { exportFile(...x: string[]): Promise<ExportInfo> } }
      ).__dstudio.exportFile(t!, a!, b!),
    [templateId, app, background],
  );
}

const ascii = (bytes: number[]) => String.fromCharCode(...bytes);

test('MOV ProRes 4444 with transparency', async ({ page }) => {
  const r = await exportFile(page, 'lower-third', 'premiere', 'alpha');
  expect(r.fileName).toBe('synthe_gildas-ovono-mba_16x9.mov');
  expect(ascii(r.head.slice(4, 8))).toMatch(/ftyp|wide|mdat|moov/);
  expect(r.size).toBeGreaterThan(10_000);
});

test('WebM VP8 with transparency', async ({ page }) => {
  const r = await exportFile(page, 'intro', 'web', 'alpha');
  expect(r.fileName.endsWith('.webm')).toBe(true);
  expect(r.head.slice(0, 4)).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
});

test('MP4 on a green background', async ({ page }) => {
  const r = await exportFile(page, 'chapter', 'premiere', 'green');
  expect(r.fileName.endsWith('.mp4')).toBe(true);
  expect(ascii(r.head.slice(4, 8))).toBe('ftyp');
});

test('batch of lower thirds as a zip', async ({ page }) => {
  const r = await exportFile(page, 'lower-third-batch', 'web', 'alpha');
  expect(r.fileName).toBe('synthes-en-lot_16x9.zip');
  expect(ascii(r.head.slice(0, 2))).toBe('PK');
});

test('PNG sequence as a zip', async ({ page }) => {
  const r = await exportFile(page, 'end-card', 'png', 'alpha');
  expect(r.fileName.endsWith('.zip')).toBe(true);
  expect(ascii(r.head.slice(0, 2))).toBe('PK');
});

test('the export button downloads the file', async ({ page }) => {
  await page.locator('.tpl', { hasText: 'Synthé' }).first().click();
  await page.getByRole('tab', { name: /Animation/ }).click();
  await page.getByLabel(/Temps à l'écran/).fill('2');
  await page.getByRole('tab', { name: /Exporter/ }).click();
  await page.getByRole('button', { name: 'Web / autre' }).click();
  const download = page.waitForEvent('download', { timeout: 200_000 });
  await page.getByTestId('export-button').click();
  expect((await download).suggestedFilename()).toBe('synthe_gildas-ovono-mba_16x9.webm');
  await expect(page.getByText("C'est prêt !")).toBeVisible();
});
