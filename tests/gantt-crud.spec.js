import { test, expect } from '@playwright/test';
import { process } from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Gantt CRUD Operations [${frontendName} + ${backendName}]`, () => {
    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Gantt to load
        await page.waitForSelector('.b-gantt', { timeout : 10000 });
        await page.waitForLoadState('networkidle');
    });

    test('should load initial tasks from backend', async({ page }) => {
        // Wait for tasks to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Check that tasks are visible
        const taskRows = await page.locator('.b-grid-row').count();
        expect(taskRows).toBeGreaterThan(0);

        // Check that first task has expected content
        const firstTask = page.locator('.b-grid-row').first();
        await expect(firstTask).toBeVisible();
    });

    test('should create a new task', async({ page }) => {
        // Wait for Gantt to be ready
        await page.waitForSelector('.b-gantt-task', { timeout : 5000 });

        // Get initial task count
        const initialTaskCount = await page.locator('.b-grid-row').count();

        // Right-click on gantt area to get context menu
        await page.locator('.b-gantt-body').click({ button : 'right' });

        // Look for "Add task" option in context menu
        const addTaskOption = page.locator('.b-menu-item').filter({ hasText : /add.*task/i });
        if (await addTaskOption.count() > 0) {
            await addTaskOption.click();
        }
        else {
            // Alternative: Try double-clicking to create task
            await page.locator('.b-gantt-body').dblclick();
        }

        // Wait for new task to appear
        await page.waitForTimeout(1000);

        // Check if a new task was added
        const newTaskCount = await page.locator('.b-grid-row').count();
        expect(newTaskCount).toBeGreaterThan(initialTaskCount);
    });

    test('should edit task name', async({ page }) => {
        // Wait for tasks to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Find first task name cell
        const firstTaskNameCell = page.locator('.b-grid-row').first().locator('[data-column="name"]');

        // Double-click to edit
        await firstTaskNameCell.dblclick();

        // Wait for editor to appear
        await page.waitForSelector('.b-editor input', { timeout : 2000 });

        // Clear and type new name
        const editor = page.locator('.b-editor input');
        await editor.fill('Updated Task Name');
        await editor.press('Enter');

        // Wait for update to complete
        await page.waitForTimeout(1000);

        // Verify the name was updated
        await expect(firstTaskNameCell).toContainText('Updated Task Name');
    });

    test('should edit task dates', async({ page }) => {
        // Wait for tasks to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Find first task start date cell
        const firstTaskStartDateCell = page.locator('.b-grid-row').first().locator('[data-column="startDate"]');

        // Double-click to edit start date
        await firstTaskStartDateCell.dblclick();

        // Wait for date editor
        await page.waitForSelector('.b-editor input', { timeout : 2000 });

        // Set new date
        const dateEditor = page.locator('.b-editor input');
        await dateEditor.fill('2024-01-15');
        await dateEditor.press('Enter');

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify date was updated (check for partial match since format may vary)
        await expect(firstTaskStartDateCell).toContainText('2024');
    });

    test('should delete a task', async({ page }) => {
        // Wait for tasks to load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Get initial task count
        const initialTaskCount = await page.locator('.b-grid-row').count();

        // Right-click on first task
        const firstTask = page.locator('.b-grid-row').first();
        await firstTask.click({ button : 'right' });

        // Look for delete option in context menu
        const deleteOption = page.locator('.b-menu-item').filter({ hasText : /delete/i });
        if (await deleteOption.count() > 0) {
            await deleteOption.click();

            // Handle confirmation dialog if it appears
            const confirmButton = page.locator('.b-button').filter({ hasText : /yes|ok|delete/i });
            if (await confirmButton.count() > 0) {
                await confirmButton.click();
            }
        }
        else {
            // Alternative: Select task and press Delete key
            await firstTask.click();
            await page.keyboard.press('Delete');
        }

        // Wait for deletion to complete
        await page.waitForTimeout(1000);

        // Verify task count decreased
        const newTaskCount = await page.locator('.b-grid-row').count();
        expect(newTaskCount).toBeLessThan(initialTaskCount);
    });

    test('should sync changes with backend', async({ page }) => {
        // Monitor network requests
        const syncRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/sync')) {
                syncRequests.push(request);
            }
        });

        // Wait for initial load
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        // Make a change to trigger sync
        const firstTaskNameCell = page.locator('.b-grid-row').first().locator('[data-column="name"]');
        await firstTaskNameCell.dblclick();

        // Wait for editor
        await page.waitForSelector('.b-editor input', { timeout : 2000 });

        // Edit and save
        const editor = page.locator('.b-editor input');
        await editor.fill('Test Sync Task');
        await editor.press('Enter');

        // Wait for sync request
        await page.waitForTimeout(2000);

        // Verify sync request was made
        expect(syncRequests.length).toBeGreaterThan(0);

        // Verify the change persists after page reload
        await page.reload();
        await page.waitForSelector('.b-grid-row', { timeout : 5000 });

        const reloadedFirstTask = page.locator('.b-grid-row').first().locator('[data-column="name"]');
        await expect(reloadedFirstTask).toContainText('Test Sync Task');
    });

    test('should handle task dependencies', async({ page }) => {
        // Wait for gantt to load
        await page.waitForSelector('.b-gantt-task', { timeout : 5000 });

        // Get task bars
        const taskBars = page.locator('.b-gantt-task');
        const taskCount = await taskBars.count();

        if (taskCount >= 2) {
            // Try to create dependency by dragging from first task to second
            const firstTask = taskBars.first();
            const secondTask = taskBars.nth(1);

            // Hover over first task to show dependency connector
            await firstTask.hover();

            // Look for dependency connector
            const connector = page.locator('.b-task-connector, .b-dependency-connector');
            if (await connector.count() > 0) {
                // Drag to create dependency
                await connector.first().dragTo(secondTask);

                // Wait for dependency to be created
                await page.waitForTimeout(1000);

                // Check if dependency line appeared
                const dependencyLine = page.locator('.b-gantt-dependency');
                await expect(dependencyLine.first()).toBeVisible();
            }
        }
    });
});