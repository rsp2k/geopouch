import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PouchDB from 'pouchdb'
import memdown from 'memdown'
import Spatial from '../index.js'
import towns from './towns.json'

// Plugin registration
PouchDB.plugin(Spatial)

describe('GeoPouch Modern Tests', () => {
  let db

  beforeEach(async () => {
    db = new PouchDB('test-modern', { adapter: 'memory', db: memdown })
  })

  afterEach(async () => {
    if (db) {
      await db.destroy()
    }
  })

  describe('Spatial Query Functionality', () => {
    it('should perform basic spatial query', async () => {
      // Load test data
      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      // Perform spatial query
      const result = await db.spatial(
        function (doc) {
          emit(doc.geometry)
        },
        [[-71.70639038085936, 42.353469793490646], [-71.56219482421875, 42.461966608980134]]
      )

      expect(result).toHaveLength(9)

      const townNames = result.map(item => item.id).sort()
      expect(townNames).toEqual([
        'BERLIN',
        'BOLTON',
        'BOYLSTON',
        'CLINTON',
        'HARVARD',
        'HUDSON',
        'LANCASTER',
        'MARLBOROUGH',
        'NORTHBOROUGH'
      ])
    })

    it('should handle point queries', async () => {
      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      const result = await db.spatial(
        function (doc) {
          emit(doc.geometry)
        },
        [-70.98495, 42.24867, -70.98495, 42.24867]
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('QUINCY')
    })

    it('should work with design documents', async () => {
      // Create design document
      await db.put({
        _id: '_design/spatial',
        spatial: {
          points: function (doc) {
            emit(doc.geometry)
          }.toString()
        }
      })

      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      const result = await db.spatial(
        'spatial/points',
        [-70.98495, 42.24867, -70.98495, 42.24867]
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('QUINCY')
    })

    it('should support include_docs option', async () => {
      await db.put({
        _id: '_design/spatial',
        spatial: {
          points: function (doc) {
            emit(doc.geometry)
          }.toString()
        }
      })

      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      const result = await db.spatial(
        'spatial/points',
        [-70.98495, 42.24867, -70.98495, 42.24867],
        { include_docs: true }
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('QUINCY')
      expect(result[0].doc).toBeDefined()
      expect(result[0].doc._id).toBe('QUINCY')
    })

    it('should handle document deletion', async () => {
      await db.put({
        _id: '_design/spatial',
        spatial: {
          points: function (doc) {
            emit(doc.geometry)
          }.toString()
        }
      })

      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      // First query should return result
      let result = await db.spatial(
        'spatial/points',
        [-70.98495, 42.24867, -70.98495, 42.24867]
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('QUINCY')

      // Delete the document
      const doc = await db.get('QUINCY')
      await db.remove(doc)

      // Second query should return empty
      result = await db.spatial(
        'spatial/points',
        [-70.98495, 42.24867, -70.98495, 42.24867]
      )

      expect(result).toHaveLength(0)
    })

    it('should handle stale option', async () => {
      await db.put({
        _id: '_design/spatial',
        spatial: {
          points: function (doc) {
            emit(doc.geometry)
          }.toString()
        }
      })

      const docs = towns.features.map(doc => {
        doc._id = doc.properties.TOWN
        return doc
      })

      await db.bulkDocs(docs)

      const result = await db.spatial(
        'spatial/points',
        [-70.98495, 42.24867, -70.98495, 42.24867],
        { stale: true }
      )

      // With stale: true, should return empty before indexing
      expect(result).toHaveLength(0)
    })
  })

  describe('Multi-dimensional Support', () => {
    it('should handle 3D coordinates', async () => {
      const doc3d = {
        _id: 'point3d',
        geometry: {
          type: 'Point',
          coordinates: [1, 2, 3]
        }
      }

      await db.put(doc3d)

      const result = await db.spatial(
        function (doc) {
          emit(doc.geometry)
        },
        [[0, 1, 2], [2, 3, 4]]
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('point3d')
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now()

      const largeDocs = Array.from({ length: 1000 }, (_, i) => ({
        _id: `doc_${i}`,
        geometry: {
          type: 'Point',
          coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90]
        }
      }))

      await db.bulkDocs(largeDocs)

      const result = await db.spatial(
        function (doc) {
          emit(doc.geometry)
        },
        [[-10, -10], [10, 10]]
      )

      const elapsed = Date.now() - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(elapsed).toBeLessThan(5000)
      expect(Array.isArray(result)).toBe(true)
    })
  })
})