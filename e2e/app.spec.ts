import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('home lists every template with an animated preview', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Qu'est-ce que tu veux ajouter/ })).toBeVisible();
  const cards = page.locator('.tpl');
  await expect(cards).toHaveCount(7);
  await expect(cards.first()).toContainText("Titre d'intro");
});

test('create a lower third, edit it, and find it again after reload', async ({ page }) => {
  await page.locator('.tpl', { hasText: 'Synthé' }).first().click();
  await expect(page).toHaveURL(/#editeur$/);
  await expect(page.getByRole('heading', { name: 'Synthé', level: 1 })).toBeVisible();

  const canvas = page.getByTestId('preview-canvas');
  await page.getByRole('button', { name: 'Pause' }).click();
  // Go to the middle of the clip, where the text is fully visible.
  await page.getByRole('slider', { name: 'Ligne de temps' }).click();
  const before = await canvas.screenshot();
  await page.getByLabel('Nom').fill('Camille Durand');
  await expect.poll(async () => Buffer.compare(await canvas.screenshot(), before)).not.toBe(0);

  // Steps
  await page.getByRole('tab', { name: /Style/ }).click();
  await page.getByRole('button', { name: /Blanc éditorial/ }).click();
  await page.getByRole('button', { name: /Suivant : Animation/ }).click();
  await expect(page.getByRole('button', { name: /Rideau masqué/ })).toBeVisible();

  // Undo restores the previous card style
  await page.keyboard.press('Control+z');
  await page.getByRole('tab', { name: /Style/ }).click();
  await expect(page.getByRole('button', { name: /Sombre verre/ })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await page.getByRole('link', { name: 'Mes créations' }).click();
  await expect(page.locator('.row-title').first()).toHaveText('Synthé · Camille Durand');
});

test('the export step recommends a format for the chosen editing software', async ({ page }) => {
  await page.locator('.tpl', { hasText: "Titre d'intro" }).click();
  await page.getByRole('tab', { name: /Exporter/ }).click();
  const reco = page.getByTestId('export-recommendation');
  await page.getByRole('button', { name: 'Premiere Pro' }).click();
  await expect(reco).toContainText('ProRes 4444');
  await expect(page.getByTestId('export-filename')).toHaveText('intro_un-mot-deux-reponses_16x9.mov');
  await page.getByRole('button', { name: 'Web / autre' }).click();
  await expect(reco).toContainText('WebM');
  await page.getByRole('button', { name: 'Vert (incrustation)' }).click();
  await expect(reco).toContainText('MP4');
  await expect(page.getByTestId('export-filename')).toHaveText('intro_un-mot-deux-reponses_16x9.mp4');
});

test('switching to 9:16 turns on the safe zones', async ({ page }) => {
  await page.locator('.tpl', { hasText: 'Synthé' }).first().click();
  await page.getByRole('button', { name: '9:16' }).click();
  await expect(page.getByRole('button', { name: /Zones sûres/ })).toHaveAttribute('aria-pressed', 'true');
  const box = await page.getByTestId('preview-canvas').boundingBox();
  expect(box!.height).toBeGreaterThan(box!.width);
});

test('brand kit changes the accent used by new creations', async ({ page }) => {
  await page.getByRole('link', { name: 'Kit de marque' }).click();
  await page.getByLabel('Nom de la marque').fill('Acme');
  await page.getByRole('link', { name: 'Créer' }).click();
  await page.locator('.tpl', { hasText: "Titre d'intro" }).click();
  await page.getByRole('tab', { name: /Style/ }).click();
  await expect(page.getByRole('button', { name: /^Couleur d'accent #/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('playing card: ready-made cards fill every field', async ({ page }) => {
  await page.locator('.tpl', { hasText: 'Carte à jouer' }).click();
  await page.getByRole('button', { name: /Vrai ou faux/ }).click();
  await expect(page.getByLabel('Titre')).toHaveValue('VRAI OU FAUX');
  await expect(page.getByLabel('Numéro (médaillon)')).toHaveValue('?');
});
