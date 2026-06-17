import { test, expect } from '@playwright/test';

test.describe('Plans Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with a known test user
    await page.goto('/login');
    await page.getByPlaceholder('Correo electrónico').fill('test_6508@example.com');
    await page.getByPlaceholder('Contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('should create a plan and interact with it', async ({ page }) => {
    await page.goto('/plans');

    // Create new plan
    await page.getByRole('button', { name: /Crear plan/i }).click();

    const planTitle = `E2E Test Plan ${Math.floor(Math.random() * 1000)}`;
    await page.getByPlaceholder('¿Qué propones?').fill(planTitle);
    await page
      .getByPlaceholder('Cuenta los detalles...')
      .fill('Este es un plan creado por una prueba automatizada.');
    await page.getByPlaceholder('📍 Dónde').fill('Virtual World');

    // DatePicker (click the last available day because past days are disabled)
    await page.getByText('Cuándo').click();
    await page.locator('.rdp-day:not(.rdp-day_outside)').last().click();

    await page.getByRole('button', { name: 'Publicar plan' }).click();

    // Verify plan is visible
    await expect(page.getByText(planTitle)).toBeVisible();

    // Interact with reactions
    const heartReaction = page.locator('button:has-text("❤️")').first();
    await heartReaction.click();
    // Re-clicking might toggle it, but let's check it doesn't crash

    // Add a comment
    await page.getByPlaceholder('Escribe un comentario...').first().fill('¡Me apunto!');
    await page.locator('button:has(.lucide-send)').first().click();

    await expect(page.getByText('¡Me apunto!').first()).toBeVisible();

    // Initially, the creator is a participant, so let's click "Me apunto" to exit the plan and then rejoin to test the flow
    await page
      .getByRole('button', { name: /Me apunto/i })
      .first()
      .click();
    // Rejoin the plan
    await page
      .getByRole('button', { name: /Me apunto/i })
      .first()
      .click();

    // Wait to render participants hover
    await page.waitForTimeout(1000);

    // Verify user is marked as participant (there will be 1 participant: string "· 1")
    await expect(page.getByText(/· 1/).first()).toBeVisible();

    // Verify chat group is accessible for the plan
    await page.goto('/chat');
    await expect(page.getByText(planTitle)).toBeVisible();
  });
});
