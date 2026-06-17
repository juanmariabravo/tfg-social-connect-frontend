import { test, expect } from '@playwright/test';

test.describe('Auth & Onboarding Flow', () => {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const username = `testuser_${randomSuffix}`;
  const email = `test_${randomSuffix}@example.com`;
  const password = 'Password123!';

  test('should register and complete onboarding', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');

    await page.getByPlaceholder('Correo electrónico').fill(email);
    await page.getByPlaceholder('Contraseña', { exact: true }).fill(password);
    await page.getByPlaceholder('Confirmar contraseña').fill(password);
    await page.getByPlaceholder('usuario').fill(username);

    // Fill birth date
    await page.getByText('Fecha de nacimiento').click();
    await page.click('.rdp-day:not(.rdp-day_outside)');

    await page.getByRole('button', { name: 'Comenzar' }).click();

    // Should redirect to /profile (which is the Onboarding start)
    await expect(page).toHaveURL(/\/profile/);

    // 2. Onboarding Step 1: Profile
    await page.getByPlaceholder('Cómo quieres que te llamen').fill(`Test User ${randomSuffix}`);
    await page.getByPlaceholder('Dónde vives o tu ciudad favorita').fill('Madrid');
    await page
      .getByPlaceholder('Tus aficiones, metas...')
      .fill('Me gusta el testing y la automatización.');

    await page.getByRole('button', { name: 'Continuar' }).click();

    // 3. Onboarding Step 2: Interests
    await expect(page.getByText('¿Qué te apasiona?')).toBeVisible();

    // Select 3 interests (assuming they are buttons with the interest text)
    // Using a more generic selector if possible, or picking specific ones
    const interests = page.locator('button.rounded-full.border');
    await interests.nth(0).click();
    await interests.nth(1).click();
    await interests.nth(2).click();

    await page.getByRole('button', { name: 'Siguiente' }).click();

    // 4. Onboarding Step 3: Personality
    await expect(page.getByText('Test de Personalidad')).toBeVisible();

    // Answer 5 questions (assuming there are 5 buttons for 1-5)
    for (let i = 0; i < 5; i++) {
      await page.locator('button.aspect-square').nth(2).click(); // Click middle option (3)
    }

    await expect(page.getByText('¡Casi estamos!')).toBeVisible();
    await page.getByRole('button', { name: 'Empezar ahora' }).click();

    // Should redirect to Home/Feed
    await expect(page).toHaveURL('/home');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
