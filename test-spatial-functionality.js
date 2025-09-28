#!/usr/bin/env node

/**
 * Comprehensive GeoPouch Testing Script
 * Tests core spatial functionality with PouchDB v9.0.0
 */

const PouchDB = require('pouchdb');
const GeoPouch = require('./index.js');

// Add the spatial plugin
PouchDB.plugin(GeoPouch);

console.log('🧪 Testing GeoPouch v3.0.0 with PouchDB v9.0.0');
console.log('Node.js version:', process.version);
console.log('');

async function runTests() {
  let testCount = 0;
  let passCount = 0;

  async function test(name, fn) {
    testCount++;
    console.log(`🔬 Test ${testCount}: ${name}`);
    try {
      await fn();
      passCount++;
      console.log(`   ✅ PASS\n`);
      return true;
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}\n`);
      return false;
    }
  }

  // Test 1: Basic Plugin Loading
  await test('Plugin loads correctly', async () => {
    const db = new PouchDB('test-plugin');
    if (typeof db.spatial !== 'function') {
      throw new Error('spatial method not available on database');
    }
    await db.destroy();
  });

  // Test 2: Simple Spatial Query
  await test('Simple spatial query with function', async () => {
    const db = new PouchDB('test-simple');

    // Add test documents
    await db.bulkDocs([
      {
        _id: 'point1',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      {
        _id: 'point2',
        geometry: {
          type: 'Point',
          coordinates: [1, 1]
        }
      }
    ]);

    // Query spatial data
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-1, -1, 2, 2]);

    if (results.length !== 2) {
      throw new Error(`Expected 2 results, got ${results.length}`);
    }

    await db.destroy();
  });

  // Test 3: Design Document Spatial Query
  await test('Design document spatial query', async () => {
    const db = new PouchDB('test-design');

    // Create design document
    await db.put({
      _id: '_design/spatial',
      spatial: {
        points: function(doc) {
          if (doc.geometry) {
            emit(doc.geometry);
          }
        }.toString()
      }
    });

    // Add test documents
    await db.bulkDocs([
      {
        _id: 'doc1',
        geometry: {
          type: 'Point',
          coordinates: [10, 20]
        }
      },
      {
        _id: 'doc2',
        geometry: {
          type: 'Point',
          coordinates: [30, 40]
        }
      }
    ]);

    // Query using design document
    const results = await db.spatial('spatial/points', [5, 15, 35, 45]);

    if (results.length !== 2) {
      throw new Error(`Expected 2 results, got ${results.length}`);
    }

    await db.destroy();
  });

  // Test 4: Different Bounding Box Formats
  await test('Multiple bounding box formats', async () => {
    const db = new PouchDB('test-bbox');

    await db.put({
      _id: 'center',
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Test different bbox formats
    const results1 = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-1, -1, 1, 1]); // Array format

    const results2 = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [[-1, -1], [1, 1]]); // Nested array format

    if (results1.length !== 1 || results2.length !== 1) {
      throw new Error('Different bbox formats should return same results');
    }

    await db.destroy();
  });

  // Test 5: Include Docs Option
  await test('Include docs option', async () => {
    const db = new PouchDB('test-include');

    await db.put({
      _id: '_design/geo',
      spatial: {
        all: function(doc) {
          emit(doc.geometry);
        }.toString()
      }
    });

    await db.put({
      _id: 'test-doc',
      name: 'Test Location',
      geometry: {
        type: 'Point',
        coordinates: [5, 5]
      }
    });

    const results = await db.spatial('geo/all', [0, 0, 10, 10], {
      include_docs: true
    });

    if (!results[0].doc || results[0].doc.name !== 'Test Location') {
      throw new Error('include_docs option not working');
    }

    await db.destroy();
  });

  // Test 6: Performance Test
  await test('Performance with multiple documents', async () => {
    const db = new PouchDB('test-performance');

    console.log('      📊 Adding 100 documents...');
    const docs = [];
    for (let i = 0; i < 100; i++) {
      docs.push({
        _id: `doc-${i}`,
        geometry: {
          type: 'Point',
          coordinates: [Math.random() * 100, Math.random() * 100]
        }
      });
    }

    const start = Date.now();
    await db.bulkDocs(docs);

    console.log('      🔍 Running spatial query...');
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [25, 25, 75, 75]);

    const elapsed = Date.now() - start;
    console.log(`      ⏱️  Query completed in ${elapsed}ms, found ${results.length} results`);

    if (results.length === 0) {
      throw new Error('No results found in performance test');
    }

    await db.destroy();
  });

  // Test 7: Complex Geometry
  await test('Complex geometry types', async () => {
    const db = new PouchDB('test-complex');

    await db.bulkDocs([
      {
        _id: 'polygon',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0,0], [10,0], [10,10], [0,10], [0,0]]]
        }
      },
      {
        _id: 'multipoint',
        geometry: {
          type: 'MultiPoint',
          coordinates: [[1,1], [2,2], [3,3]]
        }
      }
    ]);

    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-1, -1, 11, 11]);

    if (results.length < 2) {
      throw new Error('Complex geometries not handled correctly');
    }

    await db.destroy();
  });

  // Summary
  console.log('🎯 Test Results Summary');
  console.log('═══════════════════════');
  console.log(`Total tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);
  console.log(`Success rate: ${((passCount / testCount) * 100).toFixed(1)}%`);

  if (passCount === testCount) {
    console.log('\n🎉 All tests passed! GeoPouch is working perfectly!');
    return true;
  } else {
    console.log(`\n⚠️  ${testCount - passCount} test(s) failed. See details above.`);
    return false;
  }
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});