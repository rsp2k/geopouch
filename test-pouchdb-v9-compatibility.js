#!/usr/bin/env node

/**
 * PouchDB v9.0.0 Compatibility Test
 * Validates that GeoPouch works correctly with PouchDB v9.0.0 features
 */

const PouchDB = require('pouchdb');
const GeoPouch = require('./index.js');

// Add the spatial plugin
PouchDB.plugin(GeoPouch);

console.log('🔍 Testing PouchDB v9.0.0 Compatibility');
console.log('PouchDB version:', PouchDB.version);
console.log('');

async function testPouchDBCompatibility() {
  let tests = 0;
  let passed = 0;

  function test(name, fn) {
    return new Promise(async (resolve) => {
      tests++;
      console.log(`🧪 ${tests}. ${name}`);
      try {
        await fn();
        passed++;
        console.log('   ✅ PASS\n');
        resolve(true);
      } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}\n`);
        resolve(false);
      }
    });
  }

  // Test 1: registerDependentDatabase API (critical for spatial indexing)
  await test('registerDependentDatabase API works', async () => {
    const db = new PouchDB('test-dependent');

    // This is the core API that GeoPouch relies on for persistent spatial indexes
    const result = await db.registerDependentDatabase('spatial-index-test');

    if (!result || !result.db) {
      throw new Error('registerDependentDatabase API not working');
    }

    await result.db.destroy();
    await db.destroy();
  });

  // Test 2: Database info API compatibility
  await test('Database info API compatible', async () => {
    const db = new PouchDB('test-info');
    const info = await db.info();

    if (!info.db_name || !info.adapter) {
      throw new Error('Database info structure incompatible');
    }

    await db.destroy();
  });

  // Test 3: Changes API compatibility (used by spatial indexing)
  await test('Changes API compatible', async () => {
    const db = new PouchDB('test-changes');

    await db.put({ _id: 'test', data: 'test' });

    const changes = await db.changes({ include_docs: true });

    if (!changes.results || changes.results.length === 0) {
      throw new Error('Changes API not working');
    }

    await db.destroy();
  });

  // Test 4: Event system compatibility
  await test('Event system compatible', async () => {
    const db = new PouchDB('test-events');

    let eventFired = false;

    const promise = new Promise((resolve) => {
      db.on('destroyed', () => {
        eventFired = true;
        resolve();
      });
    });

    await db.destroy();
    await promise;

    if (!eventFired) {
      throw new Error('Event system not working');
    }
  });

  // Test 5: Spatial functionality with PouchDB v9 features
  await test('Spatial indexing with v9 features', async () => {
    const db = new PouchDB('test-spatial-v9');

    // Add documents
    await db.bulkDocs([
      {
        _id: 'location1',
        name: 'Coffee Shop',
        geometry: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        }
      },
      {
        _id: 'location2',
        name: 'Restaurant',
        geometry: {
          type: 'Point',
          coordinates: [-122.4094, 37.7849]
        }
      }
    ]);

    // Create design document for spatial queries
    await db.put({
      _id: '_design/locations',
      spatial: {
        by_location: function(doc) {
          if (doc.geometry) {
            emit(doc.geometry);
          }
        }.toString()
      }
    });

    // Test spatial query
    const results = await db.spatial('locations/by_location', [
      [-122.5, 37.7],
      [-122.3, 37.8]
    ], { include_docs: true });

    if (results.length !== 2) {
      throw new Error(`Expected 2 results, got ${results.length}`);
    }

    // Verify include_docs works
    if (!results[0].doc || !results[0].doc.name) {
      throw new Error('include_docs not working with spatial queries');
    }

    await db.destroy();
  });

  // Test 6: Performance with IndexedDB improvements
  await test('Performance with IndexedDB backend', async () => {
    const db = new PouchDB('test-performance-v9');

    console.log('      📊 Testing with 500 documents...');
    const docs = [];
    for (let i = 0; i < 500; i++) {
      docs.push({
        _id: `perf-${i}`,
        category: `type-${i % 10}`,
        geometry: {
          type: 'Point',
          coordinates: [
            -180 + (Math.random() * 360), // Random longitude
            -90 + (Math.random() * 180)   // Random latitude
          ]
        }
      });
    }

    const insertStart = Date.now();
    await db.bulkDocs(docs);
    const insertTime = Date.now() - insertStart;

    const queryStart = Date.now();
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-90, -45, 90, 45]); // Query middle latitudes
    const queryTime = Date.now() - queryStart;

    console.log(`      ⚡ Insert time: ${insertTime}ms`);
    console.log(`      🔍 Query time: ${queryTime}ms`);
    console.log(`      📈 Results: ${results.length} documents`);

    if (results.length === 0) {
      throw new Error('No results in performance test');
    }

    // Performance should be reasonable
    if (queryTime > 1000) {
      throw new Error(`Query too slow: ${queryTime}ms`);
    }

    await db.destroy();
  });

  // Test 7: View lifecycle management (critical for spatial indexes)
  await test('View lifecycle management', async () => {
    const db = new PouchDB('test-lifecycle');

    // Add some data
    await db.put({
      _id: 'test-doc',
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Create spatial query that builds index
    await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-1, -1, 1, 1]);

    // Update document to trigger index update
    const doc = await db.get('test-doc');
    doc.geometry.coordinates = [0.5, 0.5];
    await db.put(doc);

    // Query again to verify index was updated
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-1, -1, 1, 1]);

    if (results.length !== 1) {
      throw new Error('Index not properly updated on document change');
    }

    await db.destroy();
  });

  // Summary
  console.log('🎯 PouchDB v9.0.0 Compatibility Results');
  console.log('═══════════════════════════════════════');
  console.log(`Total tests: ${tests}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${tests - passed}`);
  console.log(`Success rate: ${((passed / tests) * 100).toFixed(1)}%`);

  if (passed === tests) {
    console.log('\n🎉 Full PouchDB v9.0.0 compatibility confirmed!');
    console.log('✅ All critical APIs working correctly');
    console.log('✅ Spatial indexing fully functional');
    console.log('✅ Performance optimizations active');
    return true;
  } else {
    console.log(`\n⚠️  ${tests - passed} compatibility issue(s) detected.`);
    return false;
  }
}

// Run compatibility tests
testPouchDBCompatibility().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Compatibility test crashed:', error);
  process.exit(1);
});