import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Task Board CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Scheduler Pro to load
        await page.waitForSelector('.b-taskboard', { timeout : 10000 });
        await page.waitForSelector('.b-taskboard-card', { timeout : 5000 });
        await page.waitForLoadState('networkidle');
    });

    // test('create a new task', async({ page }) => {

    // });

    test('edit a task: all fields', async({ page }) => {
        // Find "Go to airport" task in Todo column and drag it to Doing column
        const goToAirportTask = page.getByText('Go to airport');
        const packBagsTask = page.getByText('Pack bags');

        // Drag "Go to airport" task to the first position in Doing column
        await goToAirportTask.dragTo(packBagsTask);

        // Click and open the task editor by selecting the task and pressing Enter
        await page.waitForTimeout(500);
        await goToAirportTask.click();
        await page.keyboard.press('Enter');

        // Wait for task editor to open
        await page.waitForSelector('.b-taskeditor-body-wrap', { timeout : 5000 });

        // Change name to "Go to train station"
        const nameInput = page.getByRole('textbox', { name : 'Name' });
        await nameInput.fill('Go to train station');

        // Add description "Heathrow Station"
        const descriptionInput = page.getByRole('textbox', { name : 'Description' });
        await descriptionInput.fill('Heathrow Station');

        // Add Celia as a resource (Emilia is already assigned)
        const resourcesListComboPickerTrigger = page.locator('#b-fieldtrigger-1');
        await resourcesListComboPickerTrigger.click();

        // Wait for resources dropdown to appear and select Celia
        const celiaResource = await page.waitForSelector('li [aria-label="Celia"]', { timeout : 2000 });
        await celiaResource.click();

        // close resources dropdown by clicking on the trigger again
        await resourcesListComboPickerTrigger.click();

        // Change color (click on Color combobox and select a color)
        const colorComboPickerTrigger = page.locator('#b-fieldtrigger-2');
        await colorComboPickerTrigger.click();

        // await page.getByText('Color').click();

        await page.waitForSelector('.b-list-item', { timeout : 2000 });
        // Select the light blue color option
        await page.locator('.b-list-item').nth(6).click();

        // Save changes by pressing Enter
        await page.keyboard.press('Enter');

        // Refresh page to test persistence
        await page.reload();

        // Wait for Task Board to load
        await page.waitForSelector('.b-taskboard-card', { timeout : 5000 });
        await page.waitForLoadState('networkidle');

        // Verify changes persisted after refresh
        await expect(page.getByText('Go to train station')).toBeVisible();

        // Verify the task is at the top of the Doing column (first card in Doing column)
        const doingColumnCards = page.locator('#b-taskboard-1-column-default-doing').locator('[data-role="item-name"]');
        await expect(doingColumnCards.first()).toContainText('Go to train station');

        // Click on the task and open editor to verify all fields
        await page.getByText('Go to train station').click();
        await page.keyboard.press('Enter');
        await page.waitForSelector('[role="dialog"]', { timeout : 5000 });

        // Verify all fields are correct
        await expect(page.getByRole('textbox', { name : 'Name' })).toHaveValue('Go to train station');
        await expect(page.getByRole('textbox', { name : 'Description' })).toHaveValue('Heathrow Station');

        // open resources dropdown
        const resourcesListComboPickerTriggerUpdated = page.locator('#b-fieldtrigger-1');
        await resourcesListComboPickerTriggerUpdated.click();

        // Wait for resources dropdown to appear and check that Celia list item is displayed
        await page.waitForSelector('li [aria-label="Celia"]', { timeout : 2000 });
        // Target the selected list item that contains Celia
        await expect(page.locator('li.b-list-item.b-selected:has([aria-label="Celia"])')).toHaveAttribute('aria-selected', 'true');

        // check that the color is light blue
        await expect(page.locator('.b-taskboard-background-color-light-blue')).toBeVisible();
    });

    // test('delete a task', async({ page }) => {

    // });
});