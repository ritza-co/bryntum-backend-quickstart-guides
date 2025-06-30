import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Calendar CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Calendar to load
        await page.waitForSelector('.b-calendar', { timeout : 10000 });
        await page.waitForSelector('[data-event-id]', { timeout : 5000 });
        await page.waitForLoadState('networkidle');
    });

    test('create a new event', async({ page }) => {

        // Get initial event count
        const initialEventCount = await page.locator('[data-event-id]').count();

        // Double-click on empty calendar area to create new event
        await page.locator('.b-cal-empty-cell').first().dblclick();

        // Wait for event editor to appear
        await page.waitForSelector('.b-eventeditor', { timeout : 5000 });

        // Fill in event name
        const nameInput = page.locator('.b-eventeditor input[name="name"]');
        await nameInput.fill('New event');

        // Save by clicking save button
        const saveButton = page.locator('.b-eventeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Wait for the new event to actually appear
        await expect(page.locator('[data-event-id]')).toHaveCount(initialEventCount + 1);

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

        // Verify the name was updated
        await expect(firstEvent).toContainText('Updated Event Name');
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

        // Expect no event with the name to be visible
        await expect(page.locator('[data-event-id]').filter({ hasText : eventName })).toHaveCount(0);
    });
});