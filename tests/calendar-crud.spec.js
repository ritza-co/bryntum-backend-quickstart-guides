// database seeded before each test
// TODO: not sure if this is the best way to do it

import { test, expect } from '@playwright/test';
import process from 'process';
import { seedDatabase } from './helpers';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Calendar CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        // Seed database before each test for clean state
        await seedDatabase();

        await page.goto('http://localhost:5173');
        // Wait for Calendar to load
        await page.waitForSelector('.b-calendar', { timeout : 10000 });
        await page.waitForSelector('[data-event-id]', { timeout : 5000 });
    });

    test('create a new event', async({ page }) => {

        // Double-click on first empty calendar area to create new event
        await page.locator('.b-cal-empty-cell').first().dblclick();

        // Wait for event editor to appear
        await page.waitForSelector('.b-eventeditor', { timeout : 5000 });

        // Fill in event name
        const nameInput = page.locator('.b-eventeditor input[name="name"]');
        await nameInput.fill('New event');

        // Save by clicking save button
        const saveButton = page.locator('.b-eventeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'POST'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Calendar to load
        await page.waitForSelector('.b-calendar', { timeout : 5000 });

        await page.waitForSelector('[data-event-id]', { timeout : 5000 });

        // Verify the event exists with correct name
        await expect(page.locator('[data-event-id]').filter({ hasText : 'New event' })).toHaveCount(1);
    });

    test('edit event name', async({ page }) => {

        // Find first event
        const firstEvent = page.locator('[data-event-id]').first();

        // Double-click to edit
        await firstEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-eventeditor input[name="name"]', { timeout : 2000 });

        // Clear and type new name
        const editor = page.locator('.b-eventeditor input[name="name"]');
        await editor.fill('Updated Event Name');

        // Save by clicking save button
        const saveButton = page.locator('.b-eventeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'POST'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Calendar to load
        await page.waitForSelector('.b-calendar', { timeout : 5000 });

        await page.waitForSelector('[data-event-id]', { timeout : 5000 });

        // Verify the name was updated
        const firstEventUpdated = page.locator('[data-event-id]').first();

        await expect(firstEventUpdated).toContainText('Updated Event Name');
    });

    test('delete an event', async({ page }) => {

        // Get first event name
        const firstEvent = page.locator('[data-event-id]').first();
        const eventName = await firstEvent.textContent();

        // Right-click on first event
        await firstEvent.click({ button : 'right' });

        // Look for delete option in context menu
        const deleteOption = page.locator('[data-ref="deleteEvent"]');
        await deleteOption.click();

        await page.waitForResponse(resp =>
            resp.url().includes('/api/') && resp.status() === 200 && resp.request().method() === 'POST'
        );

        // Refresh page to test persistence
        await page.reload();

        // Wait for Calendar to load
        await page.waitForSelector('.b-calendar', { timeout : 5000 });

        await page.waitForSelector('[data-event-id]', { timeout : 5000 });

        // Expect no event with the name to be visible
        await expect(page.locator('[data-event-id]').filter({ hasText : eventName })).toHaveCount(0);
    });
});