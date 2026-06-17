import { test, expect } from '@playwright/test';

test.describe('Social Interaction & Real-time Chat', () => {
  const randomA = Math.floor(Math.random() * 10000);
  const randomB = Math.floor(Math.random() * 10000);

  const userA = {
    username: `userA_${randomA}`,
    email: `userA_${randomA}@example.com`,
    password: 'Password123!',
  };

  const userB = {
    username: `userB_${randomB}`,
    email: `userB_${randomB}@example.com`,
    password: 'Password123!',
  };

  test('should allow two users to connect and chat in real-time', async ({ browser }) => {
    // Create two independent browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 1. Register User A
    await pageA.goto('/register');
    await pageA.getByPlaceholder('Correo electrónico').fill(userA.email);
    await pageA.getByPlaceholder('Contraseña', { exact: true }).fill(userA.password);
    await pageA.getByPlaceholder('Confirmar contraseña').fill(userA.password);
    await pageA.getByPlaceholder('usuario').fill(userA.username);
    await pageA.getByText('Fecha de nacimiento').click();
    await pageA.click('.rdp-day:not(.rdp-day_outside)');
    await pageA.getByRole('button', { name: 'Comenzar' }).click();
    await expect(pageA).toHaveURL(/\/profile/);

    // Complete minimal onboarding for A to reach Home
    await pageA.getByPlaceholder('Cómo quieres que te llamen').fill(userA.username);
    await pageA.getByPlaceholder('Dónde vives o tu ciudad favorita').fill('Madrid');
    await pageA.getByPlaceholder('Tus aficiones, metas...').fill('Testing A');
    await pageA.getByRole('button', { name: 'Continuar' }).click();
    await pageA.locator('button.rounded-full.border').nth(0).click();
    await pageA.locator('button.rounded-full.border').nth(1).click();
    await pageA.locator('button.rounded-full.border').nth(2).click();
    await pageA.getByRole('button', { name: 'Siguiente' }).click();
    for (let i = 0; i < 5; i++) await pageA.locator('button.aspect-square').nth(2).click();
    await pageA.getByRole('button', { name: 'Empezar ahora' }).click();
    await expect(pageA).toHaveURL('/home');

    // 2. Register User B
    await pageB.goto('/register');
    await pageB.getByPlaceholder('Correo electrónico').fill(userB.email);
    await pageB.getByPlaceholder('Contraseña', { exact: true }).fill(userB.password);
    await pageB.getByPlaceholder('Confirmar contraseña').fill(userB.password);
    await pageB.getByPlaceholder('usuario').fill(userB.username);
    await pageB.getByText('Fecha de nacimiento').click();
    await pageB.click('.rdp-day:not(.rdp-day_outside)');
    await pageB.getByRole('button', { name: 'Comenzar' }).click();
    await pageB.getByPlaceholder('Cómo quieres que te llamen').fill(userB.username);
    await pageB.getByPlaceholder('Dónde vives o tu ciudad favorita').fill('Barcelona');
    await pageB.getByPlaceholder('Tus aficiones, metas...').fill('Testing B');
    await pageB.getByRole('button', { name: 'Continuar' }).click();
    await pageB.locator('button.rounded-full.border').nth(0).click();
    await pageB.locator('button.rounded-full.border').nth(1).click();
    await pageB.locator('button.rounded-full.border').nth(2).click();
    await pageB.getByRole('button', { name: 'Siguiente' }).click();
    for (let i = 0; i < 5; i++) await pageB.locator('button.aspect-square').nth(2).click();
    await pageB.getByRole('button', { name: 'Empezar ahora' }).click();
    await expect(pageB).toHaveURL('/home');

    // 3. User A finds User B and sends Friend Request
    await pageA.goto('/explore');
    await pageA.getByPlaceholder('Buscar personas...').fill(userB.username);
    await pageA.waitForTimeout(1000);
    // Click on B's profile
    await pageA.locator(`a[href^="/u/"]`).first().click();
    await pageA.getByRole('button', { name: /Conectar/i }).click();
    await expect(
      pageA.getByText(/Solicitud enviada/i).or(pageA.getByRole('button', { name: /Pendiente/i }))
    ).toBeVisible();

    // 4. User B receives Notification and Accepts
    await pageB.goto('/notifications');
    await expect(pageB.getByText(`${userA.username} te ha enviado una solicitud`)).toBeVisible();
    await pageB.getByRole('button', { name: 'Aceptar' }).click();
    await expect(pageB.getByText('Solicitud aceptada').first()).toBeVisible();

    // 5. User B starts Chat with User A
    await pageB.goto('/friends');
    await pageB.locator('main').locator('a[href*="/chat"]').first().click();
    await expect(pageB).toHaveURL(/\/chat\/[a-f0-9]{24}/);

    const message = '¡Hola! ¿Qué tal?';
    await pageB.getByPlaceholder('Escribe un mensaje...').fill(message);
    await pageB.locator('button:has(.lucide-send)').click();

    // 6. User A receives Message in real-time
    await pageA.goto('/chat');
    // Wait for the chat to appear in the list
    await expect(pageA.getByText(userB.username)).toBeVisible();
    await pageA.getByText(userB.username).click();
    await expect(pageA.getByText(message)).toBeVisible();

    const reply = '¡Hola User B! Todo bien por aquí.';
    await pageA.getByPlaceholder('Escribe un mensaje...').fill(reply);
    await pageA.locator('button:has(.lucide-send)').click();

    // Verify reply on User B's screen (appears twice as last message in the chat list and in the chat window)
    await expect(pageB.getByText(reply).first()).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
