import { test, expect } from '@playwright/test';

test.describe('Explore & Profiles Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with a known test user or create one
    // For now, let's assume we have a user from previous test or seed
    // We'll use the login page
    await page.goto('/login');
    await page.getByPlaceholder('Correo electrónico').fill('test_6508@example.com');
    await page.getByPlaceholder('Contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('should explore users and view profile', async ({ page }) => {
    await page.goto('/explore');

    // Check if exploration cards are visible
    await expect(page.getByPlaceholder('Buscar personas...')).toBeVisible();

    // Filter by interests
    await page.getByRole('button', { name: 'Intereses' }).click();

    // Search for someone (might be empty depending on seed)
    await page.getByPlaceholder('Buscar personas...').fill('javier');

    // Wait for debounce and results
    await page.waitForTimeout(1000);

    // Click on the first user card (assuming Link or specific class)
    const userCards = page.locator('a[href^="/u/"]');
    if ((await userCards.count()) > 0) {
      await userCards.first().click();

      // Verify UserProfile page
      await expect(page).toHaveURL(/\/u\//);
      await expect(page.getByText(/javier/i)).toBeVisible();
      await expect(
        page.getByText(/Enviar mensaje/i).or(page.getByRole('button', { name: /Conectar/i }))
      ).toBeVisible();
    }
  });
});
