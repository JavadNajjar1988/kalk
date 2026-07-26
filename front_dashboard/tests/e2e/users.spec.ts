import { expect, test } from '@playwright/test';

const adminUsername = process.env.E2E_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('user management governance', () => {
  test.skip(!adminPassword, 'E2E_ADMIN_PASSWORD is required');

  test('loads live roles, archive and immutable audit views', async ({ page, request }) => {
    const loginResponse = await request.post('/api/auth/token_json', {
      data: { username: adminUsername, password: adminPassword },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { access_token: accessToken } = await loginResponse.json();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const policyResponse = await request.get('/api/users/policy', { headers: authHeaders });
    expect(policyResponse.ok()).toBeTruthy();
    const policyBody = await policyResponse.json();
    expect(policyBody.data.roles).toHaveLength(4);

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);
    await page.goto('/dashboard/users');

    await expect(page.getByRole('heading', { name: 'مدیریت کاربران' })).toBeVisible();
    await expect(page.getByText('سطح 1 - دسترسی کامل', { exact: true })).toBeVisible();
    await expect(page.getByText('سطح 2 - دسترسی عملیاتی', { exact: true })).toBeVisible();
    await expect(page.getByText('سطح 3 - دسترسی محدود', { exact: true })).toBeVisible();
    await expect(page.getByText('سطح 4 - دسترسی مهمان', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'حاکمیت کاربران' }).click();
    await expect(page.getByRole('dialog')).toContainText('حاکمیت و سوابق کاربران');
    await expect(page.getByRole('tab', { name: /سوابق تغییرات/ })).toBeVisible();

    const auditResponse = await request.get('/api/users/audit-logs?limit=10', { headers: authHeaders });
    expect(auditResponse.ok()).toBeTruthy();
    expect(Array.isArray((await auditResponse.json()).data)).toBeTruthy();
  });
});
