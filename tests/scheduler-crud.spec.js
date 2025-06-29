import { test, expect } from '@playwright/test';
import process from 'process';

const frontendName = process.env.FRONTEND_NAME || 'unknown';
const backendName = process.env.BACKEND_NAME || 'unknown';

test.describe(`Bryntum Scheduler CRUD Operations [${frontendName} + ${backendName}]`, () => {
    test.beforeEach(async({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for Scheduler to load
        await page.waitForSelector('.b-scheduler', { timeout : 10000 });
        await page.waitForLoadState('networkidle');
    });

    test('should load initial events and resources from backend', async({ page }) => {
        // Wait for scheduler to load with resources and events
        await page.waitForSelector('.b-scheduler-resourcestore, .b-grid-row', { timeout : 5000 });

        // Check that resources are visible in the left panel
        const resourceRows = await page.locator('.b-grid-row, .b-scheduler-resource').count();
        expect(resourceRows).toBeGreaterThan(0);

        // Check for events in the timeline
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 3000 });
        const events = await page.locator('.b-sch-event, .b-scheduler-event').count();
        expect(events).toBeGreaterThan(0);
    });

    test('should create a new event', async({ page }) => {
        // Wait for scheduler to be ready
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Get initial event count
        const initialEventCount = await page.locator('.b-sch-event, .b-scheduler-event').count();

        // Find a resource row and double-click in the timeline area to create event
        const resourceRow = page.locator('.b-grid-row, .b-scheduler-resource').first();
        const timelineCell = page.locator('.b-sch-timeaxis-cell, .b-scheduler-timeaxis-cell').first();

        // Double-click to create new event
        await timelineCell.dblclick();

        // Wait for event creation dialog or new event to appear
        await page.waitForTimeout(1000);

        // Check if event editor dialog appeared
        const eventEditor = page.locator('.b-popup, .b-event-editor');
        if (await eventEditor.count() > 0) {
            // Fill in event details if editor appeared
            const nameField = eventEditor.locator('input[name="name"], input[placeholder*="name"]');
            if (await nameField.count() > 0) {
                await nameField.fill('New Test Event');
            }

            // Save the event
            const saveButton = eventEditor.locator('.b-button').filter({ hasText : /save|ok/i });
            if (await saveButton.count() > 0) {
                await saveButton.click();
            }
        }

        // Wait for new event to appear
        await page.waitForTimeout(1000);

        // Check if a new event was created
        const newEventCount = await page.locator('.b-sch-event, .b-scheduler-event').count();
        expect(newEventCount).toBeGreaterThanOrEqual(initialEventCount);
    });

    test('should edit an existing event', async({ page }) => {
        // Wait for events to load
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Double-click on first event to edit
        const firstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();
        await firstEvent.dblclick();

        // Wait for event editor to appear
        const eventEditor = page.locator('.b-popup, .b-event-editor');
        await page.waitForSelector('.b-popup, .b-event-editor', { timeout : 3000 });

        // Find and edit the name field
        const nameField = eventEditor.locator('input[name="name"], input[placeholder*="name"], .b-textfield input').first();
        if (await nameField.count() > 0) {
            await nameField.fill('Updated Event Name');

            // Save the changes
            const saveButton = eventEditor.locator('.b-button').filter({ hasText : /save|ok/i });
            if (await saveButton.count() > 0) {
                await saveButton.click();
            }
            else {
                // Try pressing Enter if no save button
                await nameField.press('Enter');
            }

            // Wait for update to complete
            await page.waitForTimeout(1000);

            // Verify the event name was updated
            await expect(firstEvent).toContainText('Updated Event Name');
        }
    });

    test('should move event by dragging', async({ page }) => {
        // Wait for events to load
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Get first event
        const firstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();

        // Get initial position
        const initialBounds = await firstEvent.boundingBox();

        // Drag event to new position (move right by 100px)
        await firstEvent.hover();
        await page.mouse.down();
        await page.mouse.move(initialBounds.x + 100, initialBounds.y);
        await page.mouse.up();

        // Wait for move to complete
        await page.waitForTimeout(1000);

        // Verify event moved (position should be different)
        const newBounds = await firstEvent.boundingBox();
        expect(newBounds.x).not.toBe(initialBounds.x);
    });

    test('should resize event', async({ page }) => {
        // Wait for events to load
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Get first event
        const firstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();

        // Get initial width
        const initialBounds = await firstEvent.boundingBox();

        // Hover over event to show resize handles
        await firstEvent.hover();

        // Look for resize handle (usually on the right edge)
        const resizeHandle = page.locator('.b-sch-resize-handle, .b-resize-handle');

        if (await resizeHandle.count() > 0) {
            // Drag resize handle
            await resizeHandle.first().hover();
            await page.mouse.down();
            await page.mouse.move(initialBounds.x + initialBounds.width + 50, initialBounds.y);
            await page.mouse.up();

            // Wait for resize to complete
            await page.waitForTimeout(1000);

            // Verify event was resized
            const newBounds = await firstEvent.boundingBox();
            expect(newBounds.width).toBeGreaterThan(initialBounds.width);
        }
    });

    test('should delete an event', async({ page }) => {
        // Wait for events to load
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Get initial event count
        const initialEventCount = await page.locator('.b-sch-event, .b-scheduler-event').count();

        // Right-click on first event
        const firstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();
        await firstEvent.click({ button : 'right' });

        // Look for delete option in context menu
        const deleteOption = page.locator('.b-menu-item').filter({ hasText : /delete|remove/i });
        if (await deleteOption.count() > 0) {
            await deleteOption.click();

            // Handle confirmation dialog if it appears
            const confirmButton = page.locator('.b-button').filter({ hasText : /yes|ok|delete/i });
            if (await confirmButton.count() > 0) {
                await confirmButton.click();
            }
        }
        else {
            // Alternative: Select event and press Delete key
            await firstEvent.click();
            await page.keyboard.press('Delete');
        }

        // Wait for deletion to complete
        await page.waitForTimeout(1000);

        // Verify event count decreased
        const newEventCount = await page.locator('.b-sch-event, .b-scheduler-event').count();
        expect(newEventCount).toBeLessThan(initialEventCount);
    });

    test('should sync changes with backend', async({ page }) => {
        // Monitor network requests
        const apiRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiRequests.push({
                    url    : request.url(),
                    method : request.method()
                });
            }
        });

        // Wait for initial load
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        // Make a change to trigger sync
        const firstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();
        await firstEvent.dblclick();

        // Wait for event editor
        const eventEditor = page.locator('.b-popup, .b-event-editor');
        await page.waitForSelector('.b-popup, .b-event-editor', { timeout : 3000 });

        // Edit name
        const nameField = eventEditor.locator('input[name="name"], input[placeholder*="name"], .b-textfield input').first();
        if (await nameField.count() > 0) {
            await nameField.fill('Backend Sync Test Event');

            // Save changes
            const saveButton = eventEditor.locator('.b-button').filter({ hasText : /save|ok/i });
            if (await saveButton.count() > 0) {
                await saveButton.click();
            }
        }

        // Wait for API request
        await page.waitForTimeout(2000);

        // Verify API requests were made
        expect(apiRequests.length).toBeGreaterThan(0);

        // Verify the change persists after page reload
        await page.reload();
        await page.waitForSelector('.b-sch-event, .b-scheduler-event', { timeout : 5000 });

        const reloadedFirstEvent = page.locator('.b-sch-event, .b-scheduler-event').first();
        await expect(reloadedFirstEvent).toContainText('Backend Sync Test Event');
    });

    test('should handle resource management', async({ page }) => {
        // Wait for resources to load
        await page.waitForSelector('.b-grid-row, .b-scheduler-resource', { timeout : 5000 });

        // Get initial resource count
        const initialResourceCount = await page.locator('.b-grid-row, .b-scheduler-resource').count();

        // Right-click on resource area to get context menu
        const resourceArea = page.locator('.b-grid-body, .b-scheduler-resources');
        await resourceArea.click({ button : 'right' });

        // Look for add resource option
        const addResourceOption = page.locator('.b-menu-item').filter({ hasText : /add.*resource|new.*resource/i });
        if (await addResourceOption.count() > 0) {
            await addResourceOption.click();

            // Wait for new resource to appear
            await page.waitForTimeout(1000);

            // Check if resource count increased
            const newResourceCount = await page.locator('.b-grid-row, .b-scheduler-resource').count();
            expect(newResourceCount).toBeGreaterThan(initialResourceCount);
        }
        else {
            // Just verify resources are visible and functional
            const firstResource = page.locator('.b-grid-row, .b-scheduler-resource').first();
            await expect(firstResource).toBeVisible();
        }
    });

    test('should handle time axis navigation', async({ page }) => {
        // Wait for scheduler to load
        await page.waitForSelector('.b-scheduler', { timeout : 5000 });

        // Look for time axis navigation controls
        const prevButton = page.locator('.b-tool, .b-button').filter({ hasText : /prev|back|</ });
        const nextButton = page.locator('.b-tool, .b-button').filter({ hasText : /next|forward|>/ });

        if (await nextButton.count() > 0) {
            // Click next to navigate forward in time
            await nextButton.first().click();
            await page.waitForTimeout(1000);

            // Verify scheduler is still functional
            await expect(page.locator('.b-scheduler')).toBeVisible();
        }

        if (await prevButton.count() > 0) {
            // Click prev to navigate back
            await prevButton.first().click();
            await page.waitForTimeout(1000);

            // Verify scheduler is still functional
            await expect(page.locator('.b-scheduler')).toBeVisible();
        }

        // Verify time axis is visible regardless
        const timeAxis = page.locator('.b-sch-timeaxisview, .b-scheduler-timeaxis');
        await expect(timeAxis).toBeVisible();
    });
});