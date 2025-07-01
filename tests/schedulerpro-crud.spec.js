import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Scheduler Pro CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Scheduler Pro to load
        await page.waitForSelector('.b-schedulerpro', { timeout : 10000 });
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
        await page.waitForSelector('.b-schedulerpro-taskeditor', { timeout : 5000 });

        // Fill in event name
        const nameInput = page.locator('.b-schedulerpro-taskeditor input[name="name"]');
        await nameInput.fill('New Scheduler Pro event');

        // Save by clicking save button
        const saveButton = page.locator('.b-schedulerpro-taskeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Wait for the new event to actually appear

        await expect(page.locator('.b-sch-event')).toHaveCount(initialEventCount + 1);

        // Verify the event exists with correct name
        await expect(page.locator('.b-sch-event').filter({ hasText : 'New Scheduler Pro event' })).toHaveCount(1);
    });

    test('edit event name', async({ page }) => {

        // Find first event
        const firstEvent = page.locator('.b-sch-event').first();

        // Double-click to edit
        await firstEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-schedulerpro-taskeditor input[name="name"]', { timeout : 2000 });

        // Clear and type new name
        const editor = page.locator('.b-schedulerpro-taskeditor input[name="name"]');
        await editor.fill('Updated Scheduler Pro Event Name');

        // Save by clicking save button
        const saveButton = page.locator('.b-schedulerpro-taskeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Verify the name was updated
        await expect(firstEvent).toContainText('Updated Scheduler Pro Event Name');
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

    test('create a dependency', async({ page }) => {

        // Find Financial Planning event
        const financialPlanningEvent = page.locator('.b-sch-event').filter({ hasText : 'Financial Planning' });

        // Double-click on Financial Planning event to open editor
        await financialPlanningEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-schedulerpro-taskeditor', { timeout : 5000 });

        // Click on successors tab
        const successorsTab = page.locator('.b-schedulerpro-taskeditor .b-tabpanel-tab').filter({ hasText : /successors/i });
        await successorsTab.click();

        // Wait for the tab to be visible
        await page.waitForTimeout(500);

        // Click the add button to add a new dependency
        const addButton = page.locator('.b-schedulerpro-taskeditor [data-ref="add"]').nth(1);
        await addButton.click();

        // Fill in the dependency with HR Update
        await page.getByRole('textbox', { name : 'Name' }).fill('HR Update');

        // Select HR Update (9) from the dropdown that appears
        await page.locator('.b-list-item').filter({ hasText : 'HR Update (9)' }).click();

        // Save by clicking save button
        const saveButton = page.locator('.b-schedulerpro-taskeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Verify dependency was created - check for specific count instead of just visible
        await expect(page.locator('.b-sch-dependency')).toHaveCount(4);
    });

    test('update a dependency', async({ page }) => {

        // Find Breakfast Briefing event
        const breakfastBriefingEvent = page.locator('.b-sch-event').filter({ hasText : 'Breakfast Briefing' });

        // Double-click on Breakfast Briefing event to open editor
        await breakfastBriefingEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-schedulerpro-taskeditor', { timeout : 5000 });

        // Click on successors tab
        const successorsTab = page.locator('.b-schedulerpro-taskeditor .b-tabpanel-tab').filter({ hasText : /successors/i });
        await successorsTab.click();

        // Wait for the tab to be visible
        await page.waitForTimeout(500);

        // Click on the existing dependency cell to select it
        const dependencyCell = page.getByRole('gridcell').filter({ hasText : 'Financial Planning (10)' });
        await dependencyCell.click();

        // Press F2 to enter edit mode
        await page.keyboard.press('F2');

        // Click the field trigger to open dropdown
        const expandButton = page.locator('.b-grid-row .b-fieldtrigger.b-icon-picker[data-ref="expand"]');
        await expandButton.click();

        // Wait for dropdown list to appear and select first item
        await page.waitForSelector('.b-combo-picker[role="listbox"]');
        const fifthOption = page.locator('.b-combo-picker[role="listbox"] .b-list-item').nth(4);
        await fifthOption.click();

        // Save the updated dependency
        const saveButton = page.locator('.b-schedulerpro-taskeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Verify the dependency was updated
        await expect(page.locator('.b-sch-dependency')).toBeVisible();
    });

    test('delete a dependency', async({ page }) => {

        // Find Technology Update event
        const technologyUpdateEvent = page.locator('.b-sch-event').filter({ hasText : 'Technology Update' });

        // Double-click on Technology Update event to open editor
        await technologyUpdateEvent.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-schedulerpro-taskeditor', { timeout : 5000 });

        // Click on successors tab
        const successorsTab = page.locator('.b-schedulerpro-taskeditor .b-tabpanel-tab').filter({ hasText : /successors/i });
        await successorsTab.click();

        // Wait for the tab to be visible
        await page.waitForTimeout(500);

        // Select the first dependency row specifically
        const dependencyRow = page.locator('#b-grid-2-normalSubgrid > div.b-grid-row');
        await dependencyRow.click();

        // Click the remove button
        const removeButton = page.locator('.b-schedulerpro-taskeditor [data-ref="remove"]').nth(1);
        await removeButton.click();

        // Save by clicking save button
        const saveButton = page.locator('.b-schedulerpro-taskeditor .b-button').filter({ hasText : /save/i });
        await saveButton.click();

        // Verify the dependency was deleted - check for reduced count
        await expect(page.locator('.b-sch-dependency')).toHaveCount(2);
    });
});