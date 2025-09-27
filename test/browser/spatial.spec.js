import { test, expect } from '@playwright/test'

test.describe('GeoPouch Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to development server
    await page.goto('/')
  })

  test('should load GeoPouch plugin successfully', async ({ page }) => {
    // Check if PouchDB is loaded
    const pouchdbLoaded = await page.evaluate(() => {
      return typeof window.PouchDB !== 'undefined'
    })
    expect(pouchdbLoaded).toBe(true)

    // Check if spatial plugin is available
    const spatialAvailable = await page.evaluate(() => {
      const db = new window.PouchDB('test-browser')
      return typeof db.spatial === 'function'
    })
    expect(spatialAvailable).toBe(true)
  })

  test('should perform spatial queries in browser', async ({ page }) => {
    // Execute spatial query test
    const result = await page.evaluate(async () => {
      try {
        const db = new window.PouchDB('test-browser-query', { adapter: 'memory' })

        // Add test document
        await db.put({
          _id: 'test-point',
          geometry: {
            type: 'Point',
            coordinates: [-71.0589, 42.3601]
          }
        })

        // Perform spatial query
        const results = await db.spatial(
          function(doc) { emit(doc.geometry) },
          [[-72, 42], [-70, 43]]
        )

        await db.destroy()

        return {
          success: true,
          count: results.length,
          firstResult: results[0]?.id
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.firstResult).toBe('test-point')
  })

  test('should handle design document queries', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const db = new window.PouchDB('test-design-doc', { adapter: 'memory' })

        // Create design document
        await db.put({
          _id: '_design/spatial',
          spatial: {
            points: function(doc) {
              emit(doc.geometry)
            }.toString()
          }
        })

        // Add test document
        await db.put({
          _id: 'test-point-2',
          geometry: {
            type: 'Point',
            coordinates: [-71.1056, 42.3736]
          }
        })

        // Query using design document
        const results = await db.spatial(
          'spatial/points',
          [[-72, 42], [-70, 43]]
        )

        await db.destroy()

        return {
          success: true,
          count: results.length,
          firstResult: results[0]?.id
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.firstResult).toBe('test-point-2')
  })

  test('should work with include_docs option', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const db = new window.PouchDB('test-include-docs', { adapter: 'memory' })

        const testDoc = {
          _id: 'test-doc-with-data',
          name: 'Test Location',
          geometry: {
            type: 'Point',
            coordinates: [-71.2092, 42.3370]
          }
        }

        await db.put(testDoc)

        const results = await db.spatial(
          function(doc) { emit(doc.geometry) },
          [[-72, 42], [-70, 43]],
          { include_docs: true }
        )

        await db.destroy()

        return {
          success: true,
          count: results.length,
          hasDoc: !!results[0]?.doc,
          docName: results[0]?.doc?.name
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.hasDoc).toBe(true)
    expect(result.docName).toBe('Test Location')
  })

  test('should handle multi-dimensional coordinates', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const db = new window.PouchDB('test-3d', { adapter: 'memory' })

        await db.put({
          _id: '3d-point',
          geometry: {
            type: 'Point',
            coordinates: [-71, 42, 100] // 3D coordinates with altitude
          }
        })

        const results = await db.spatial(
          function(doc) { emit(doc.geometry) },
          [[-72, 41, 0], [-70, 43, 200]]
        )

        await db.destroy()

        return {
          success: true,
          count: results.length,
          firstResult: results[0]?.id
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.firstResult).toBe('3d-point')
  })

  test('development playground should be functional', async ({ page }) => {
    // Test that the playground interface works
    await expect(page.locator('h1')).toContainText('GeoPouch Development Playground')

    // Test load data button
    await page.click('button:has-text("Load Test Data")')

    // Wait for data to load and check stats
    await page.waitForTimeout(1000)

    const docCount = await page.locator('#docCount').textContent()
    expect(parseInt(docCount)).toBeGreaterThan(0)

    // Test basic query button
    await page.click('button:has-text("Basic Query")')

    // Wait for query to complete
    await page.waitForTimeout(1000)

    const output = await page.locator('#output').textContent()
    expect(output).toContain('Query completed')
  })
})