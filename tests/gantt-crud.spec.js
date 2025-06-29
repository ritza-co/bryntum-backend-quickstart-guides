import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Gantt CRUD Operations [${frontendName} + ${backendName}]`, () => {

    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Gantt to load
        await page.waitForSelector('.b-gantt', { timeout : 10000 });
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });
        await page.waitForLoadState('networkidle');
    });

    test('create a new task', async({ page }) => {

        // Get initial task count
        const initialTaskCount = await page.locator('[data-task-id]').count();

        // Right-click on gantt area to get context menu
        await page.locator('[data-task-id]').first().click({ button : 'right' });

        // Look for "Add" option in context menu and hover to show submenu
        const addOption = page.locator('[data-ref="add"]');
        await addOption.hover();

        // Wait for the submenu to appear and click "Task below"
        const taskBelowOption = page.locator('.b-menuitem').filter({ hasText : /task below/i });
        await taskBelowOption.click();

        // Wait for the new task to actually appear
        await expect(page.locator('[data-task-id]')).toHaveCount(initialTaskCount + 1);
    });

    test('edit task name', async({ page }) => {

        // Find second task name cell
        const secondTaskNameCell = page.locator('.b-grid-row').nth(1).locator('[data-column="name"]');

        // Double-click to edit
        await secondTaskNameCell.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-editor input', { timeout : 2000 });

        // Clear and type new name
        const editor = page.locator('.b-editor input');
        await editor.fill('Updated Task Name');
        await editor.press('Enter');

        // Verify the name was updated (waits automatically)
        await expect(secondTaskNameCell).toContainText('Updated Task Name');
    });

    test('delete a task', async({ page }) => {

        // Get initial task count
        const initialTaskCount = await page.locator('[data-task-id]').count();
        console.log({ initialTaskCount });
        // Right-click on second task
        const secondTask = page.locator('.b-grid-row').nth(1);
        // get task name
        const taskName = await secondTask.locator('[data-column="name"]').textContent();
        await secondTask.click({ button : 'right' });

        // Look for delete option in context menu
        const deleteOption = page.locator('[data-ref="deleteTask"]');
        await deleteOption.click();

        // expect no task with the name to be visible
        await expect(page.locator('[data-task-id]').filter({ hasText : taskName })).toHaveCount(0);

        // // Wait for the task count to actually decrease (instead of arbitrary timeout)
        // console.log('> after delete', await page.locator('[data-task-id]').count());
        // await expect(page.locator('[data-task-id]')).toHaveCount(initialTaskCount - 1);
    });
});