import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Scheduler CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Scheduler to load
        await page.waitForSelector('.b-scheduler', { timeout : 10000 });
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });
        await page.waitForLoadState('networkidle');
    });

    test('create a new event', async({ page }) => {

        // Get initial event count
        const initialEventCount = await page.locator('.b-sch-event').count();

        // Double-click on first resource row in timeline area to create new event
        const timelineArea = page.locator('.b-sch-timeaxis-cell').first();

        await timelineArea.dblclick();

        // Wait for event editor to appear
        await page.waitForSelector('.b-eventeditor', { timeout : 5000 });

        // Fill in event name
        const nameInput = page.locator('.b-eventeditor input[name="name"]');
        await nameInput.fill('New scheduler event');

        // Save by clicking save button
        const saveButton = page.locator('.b-eventeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Wait for the new event to actually appear

        await expect(page.locator('.b-sch-event')).toHaveCount(initialEventCount + 1);

        // Verify the event exists with correct name
        await expect(page.locator('.b-sch-event').filter({ hasText : 'New scheduler event' })).toHaveCount(1);
    });

    test('edit event name', async({ page }) => {

        // Find first event
        const firstEvent = page.locator('.b-sch-event').first();

        // Double-click to edit
        await firstEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-eventeditor input[name="name"]', { timeout : 2000 });

        // Clear and type new name
        const editor = page.locator('.b-eventeditor input[name="name"]');
        await editor.fill('Updated Scheduler Event Name');

        // Save by clicking save button
        const saveButton = page.locator('.b-eventeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Verify the name was updated
        await expect(firstEvent).toContainText('Updated Scheduler Event Name');
    });

    test('delete an event', async({ page }) => {

        // Get first event name
        const firstEvent = page.locator('.b-sch-event').first();
        const eventName = await firstEvent.textContent();

        // Click on first event to select it
        await firstEvent.click();

        // Press Delete key to delete the event
        await page.keyboard.press('Delete');

        // Verify the specific event with that name is no longer visible (check for visibility, not DOM presence)
        await expect(page.locator('.b-sch-event').filter({ hasText : eventName })).not.toBeVisible();
    });
});