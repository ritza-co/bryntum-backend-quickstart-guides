// database seeded before each test
// TODO: not sure if this is the best way to do it

import { test, expect } from '@playwright/test';
import process from 'process';
import { seedDatabase } from './helpers';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Grid CRUD Operations [${frontendName} + ${backendName}]`, () => {
    test.beforeEach(async({ page }) => {
        // Seed database before each test for clean state
        await seedDatabase();
        await page.goto('http://localhost:5173');
        // Wait for Grid to load
        await page.waitForSelector('.b-grid', { timeout : 10000 });
    });

    test('create a new record by copying and pasting a row', async({ page }) => {
        // Wait for grid rows to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Get initial row count
        const initialRowCount = await page.locator('.b-grid-row').count();

        // Select first row and copy it
        const firstRow = page.locator('.b-grid-row').first();
        await firstRow.click();
        await page.keyboard.press('Space'); // Open context menu
        await page.getByRole('menuitem', { name : 'Copy' }).click();

        // Select second row and paste
        const secondRow = page.locator('.b-grid-row').nth(1);
        await secondRow.click();
        await page.keyboard.press('Space'); // Open context menu
        await page.getByRole('menuitem', { name : 'Paste' }).click();

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'POST'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Grid to load
        await page.waitForSelector('.b-grid', { timeout : 5000 });

        // Verify new row was created
        const newRowCount = await page.locator('.b-grid-row').count();
        expect(newRowCount).toBeGreaterThan(initialRowCount);
    });

    test('update a record name using cell editing', async({ page }) => {
        // Wait for grid rows to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Find first row name cell and edit it
        const firstRow = page.locator('.b-grid-row').first();
        await firstRow.click();

        // Start editing the name cell
        await page.keyboard.press('Enter');

        // Wait for editor to appear
        await page.waitForSelector('.b-textfield input, .b-editor input', { timeout : 2000 });

        // Edit the name
        const editor = page.locator('.b-textfield input, .b-editor input').first();
        await editor.fill('Updated Test Player');
        await page.keyboard.press('Enter');

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'PATCH'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Grid to load
        await page.waitForSelector('.b-grid', { timeout : 5000 });

        // Verify the change was saved
        await expect(firstRow).toContainText('Updated Test Player');
    });

    test('delete a record via context menu', async({ page }) => {
        // Wait for grid rows to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Get the last row and capture a unique identifier before deletion
        const firstRow = page.locator('.b-grid-row').first();
        const firstRowName = await firstRow.locator('[data-column="name"]').textContent();

        // Select last row and delete it
        await firstRow.click();
        await page.keyboard.press('Space'); // Open context menu
        await page.getByRole('menuitem', { name : 'Delete' }).click();

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'DELETE'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Grid to load
        await page.waitForSelector('.b-grid', { timeout : 5000 });

        // expect no task with the name to be in DOM
        await expect(page.locator('.b-grid-row').filter({ hasText : firstRowName })).toHaveCount(0);
    });
});