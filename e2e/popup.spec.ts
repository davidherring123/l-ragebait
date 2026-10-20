import { expect, test } from './fixtures';

test('popup loads defaults and persists controls', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(page.getByRole('heading', { name: 'L Ragebait' })).toBeVisible();
  await expect(page.getByLabel('Enabled')).toBeChecked();
  await expect(page.getByText('No API key saved')).toBeVisible();

  await page.getByLabel('Enabled').uncheck();
  await page.reload();
  await expect(page.getByLabel('Enabled')).not.toBeChecked();

  await page.getByPlaceholder('Paste a Jev API key').fill('test-key-not-real');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('API key saved')).toBeVisible();
});
