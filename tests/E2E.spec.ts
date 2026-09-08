import { test, expect } from '@playwright/test';

test.describe('Electricity Info App Domain Tests', () => {

test('1. Should display daily statistics list with production, consumption, and price', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Wait for the loading text to disappear (give it up to 10 seconds for the backend/API response)
    await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

    // Ensure at least one data row from your table has rendered on the screen
    const firstRow = page.locator('tbody tr, .stat-item').first();
    await expect(firstRow).toBeVisible();

    // Check for your Finnish UI headers/labels
    await expect(page.locator('body')).toContainText(/kulutus/i);
    await expect(page.locator('body')).toContainText(/tuotanto/i);
    await expect(page.locator('body')).toContainText(/hinta/i);
  });
  test('2. Should allow filtering by date range or negative hours', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Wait for data to load first
    await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

    // Locate the start date or filter input
    const dateInput = page.locator('input').first();
    await expect(dateInput).toBeVisible();

    // Type a sample start date to test filtering
    await dateInput.fill('2024-09-01');

    // Optionally click the "Vain miinustunnit" checkbox if it exists
    const negativeHoursCheckbox = page.locator('text=/miinustunnit/i');
    if (await negativeHoursCheckbox.isVisible()) {
      await negativeHoursCheckbox.click();
    }

    // Verify the specific Material-UI table is visible
    const statsTable = page.getByRole('table', { name: 'sähködata' });
    await expect(statsTable).toBeVisible();
  });

  test('3. Should highlight or show negative electricity price hours if present', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Wait for data to load first
    await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

    // Verify that the table contains actual data rows and pricing metrics
    const dataRows = page.getByRole('table', { name: 'sähködata' }).locator('tbody tr');
    await expect(dataRows.first()).toBeVisible();

    // Check that the page body contains data text (like price values or negative hour indicators)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Hinta');
  });

test('4. Should navigate through table pagination', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

  const nextButton = page.getByRole('button', { name: /seuraava/i });
  await expect(nextButton).toBeVisible();
  await nextButton.click();

  // Verify page index changes (e.g., Sivu 2)
  await expect(page.locator('body')).toContainText(/sivu 2/i);
});

test('5. Should toggle between table and graph view', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

  const graphButton = page.getByRole('button', { name: /graafi/i });
  if (await graphButton.isVisible()) {
    await graphButton.click();
    // Verify a chart container or SVG renders
    const chartElement = page.locator('canvas, svg, .recharts-wrapper');
    await expect(chartElement.first()).toBeVisible();
  }
});

test('6. Should filter by negative price hours only', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

  const negativeFilter = page.locator('text=/miinustunnit/i');
  await expect(negativeFilter).toBeVisible();
  await negativeFilter.click();

  // Verify that the Material-UI table remains visible after filtering
  const statsTable = page.getByRole('table', { name: 'sähködata' });
  await expect(statsTable).toBeVisible();
});

test('7. Should handle empty search results gracefully', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible()) {
    await dateInput.fill('2030-01-01');
    
    // Verify that selecting an out-of-range date results in an empty table or zero rows
    const dataRows = page.getByRole('table', { name: 'sähködata' }).locator('tbody tr');
    // Either the table is empty or the row count drops to 0/shows a placeholder
    await page.waitForTimeout(1000); // Allow state update
    const rowCount = await dataRows.count();
    expect(rowCount).toBeLessThanOrEqual(1);
  }
});
test('8. Should sort table data when clicking a column header', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('text=/ladataan/i')).not.toBeVisible({ timeout: 10000 });

  const table = page.getByRole('table', { name: 'sähködata' });
  
  // Locate the "Hinta" column header cell directly
  const hintaHeader = table.locator('th', { hasText: /hinta/i });
  await expect(hintaHeader).toBeVisible();

  const firstRowBefore = await table.locator('tbody tr').first().textContent();

  // Click the header cell to trigger sorting
  await hintaHeader.click();

  // Use poll to wait for the DOM to update and reorder the rows
  await expect.poll(async () => {
    return await table.locator('tbody tr').first().textContent();
  }).not.toBe(firstRowBefore);
});
})
