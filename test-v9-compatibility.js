/**
 * PouchDB v9.0.0 Compatibility Test Suite for GeoPouch
 * Verifies that all GeoPouch functionality works with PouchDB v9
 */

const Pouch = require('pouchdb');
const Spatial = require('./index.js');
const memdown = require('memdown');
const assert = require('assert');

// Register the spatial plugin
Pouch.plugin(Spatial);

// Test data
const testTowns = [
  {
    _id: 'BERLIN',
    geometry: {
      type: 'Point',
      coordinates: [-71.185556, 42.381944]
    },
    properties: { TOWN: 'BERLIN' }
  },
  {
    _id: 'BOLTON',
    geometry: {
      type: 'Point',
      coordinates: [-71.608056, 42.434167]
    },
    properties: { TOWN: 'BOLTON' }
  },
  {
    _id: 'QUINCY',
    geometry: {
      type: 'Point',
      coordinates: [-70.98495, 42.24867]
    },
    properties: { TOWN: 'QUINCY' }
  }
];

async function runCompatibilityTests() {
  console.log('🧪 Starting PouchDB v9.0.0 Compatibility Tests for GeoPouch');

  // Test 1: Plugin Registration
  console.log('\n✅ Test 1: Plugin registration');
  const db = new Pouch('test-spatial-v9', { db: memdown });
  assert(typeof db.spatial === 'function', 'spatial method should be available');
  console.log('   ✓ Plugin registered successfully');

  // Test 2: Database Operations with Native Promises
  console.log('\n✅ Test 2: Database operations with native promises');
  await db.bulkDocs(testTowns);
  const allDocs = await db.allDocs();
  assert(allDocs.total_rows === 3, 'Should have 3 documents');
  console.log('   ✓ Database operations work with native promises');

  // Test 3: Spatial Query with Function
  console.log('\n✅ Test 3: Spatial query with inline function');
  const spatialResults1 = await db.spatial(function (doc) {
    emit(doc.geometry);
  }, [[-72, 42], [-70, 43]]);

  assert(Array.isArray(spatialResults1), 'Results should be an array');
  assert(spatialResults1.length >= 1, 'Should find spatial matches');
  console.log(`   ✓ Found ${spatialResults1.length} spatial matches`);

  // Test 4: Design Document Based Query
  console.log('\n✅ Test 4: Design document based spatial query');
  await db.put({
    _id: '_design/spatial',
    spatial: {
      points: function (doc) {
        emit(doc.geometry);
      }.toString()
    }
  });

  const spatialResults2 = await db.spatial('spatial/points', [[-72, 42], [-70, 43]]);
  assert(Array.isArray(spatialResults2), 'Design doc results should be an array');
  console.log(`   ✓ Design document query found ${spatialResults2.length} matches`);

  // Test 5: Include Docs Option
  console.log('\n✅ Test 5: Include docs option');
  const spatialResults3 = await db.spatial('spatial/points', [[-71, 42], [-70, 43]], {
    include_docs: true
  });

  assert(spatialResults3.length > 0, 'Should have results with include_docs');
  assert(spatialResults3[0].doc, 'Results should include document data');
  assert(spatialResults3[0].doc._id, 'Document should have _id');
  console.log('   ✓ Include docs option works correctly');

  // Test 6: Stale Query Option
  console.log('\n✅ Test 6: Stale query option');
  const staleResults = await db.spatial('spatial/points', [[-71, 42], [-70, 43]], {
    stale: true
  });
  assert(Array.isArray(staleResults), 'Stale results should be an array');
  console.log('   ✓ Stale query option works correctly');

  // Test 7: Document Updates and Index Refresh
  console.log('\n✅ Test 7: Document updates and index refresh');
  await db.put({
    _id: 'CAMBRIDGE',
    geometry: {
      type: 'Point',
      coordinates: [-71.1056, 42.3751]
    },
    properties: { TOWN: 'CAMBRIDGE' }
  });

  const updatedResults = await db.spatial('spatial/points', [[-72, 42], [-70, 43]]);
  assert(updatedResults.length === spatialResults2.length + 1, 'Should reflect new document');
  console.log('   ✓ Index updates work correctly after document changes');

  // Test 8: Document Deletion
  console.log('\n✅ Test 8: Document deletion handling');
  const cambridgeDoc = await db.get('CAMBRIDGE');
  await db.remove(cambridgeDoc);

  const afterDeleteResults = await db.spatial('spatial/points', [[-72, 42], [-70, 43]]);
  assert(afterDeleteResults.length === spatialResults2.length, 'Should reflect document deletion');
  console.log('   ✓ Index updates work correctly after document deletion');

  // Test 9: Multiple Bounding Box Format
  console.log('\n✅ Test 9: Multiple bounding box formats');
  const bboxArray = await db.spatial('spatial/points', [-71, 42, -70, 43]);
  const bboxNested = await db.spatial('spatial/points', [[-71, 42], [-70, 43]]);

  assert(bboxArray.length === bboxNested.length, 'Different bbox formats should yield same results');
  console.log('   ✓ Multiple bounding box formats work correctly');

  // Test 10: Error Handling
  console.log('\n✅ Test 10: Error handling');
  try {
    await db.spatial('nonexistent/view', [[-71, 42], [-70, 43]]);
    assert.fail('Should have thrown an error for nonexistent view');
  } catch (err) {
    assert(err.status === 404, 'Should return 404 for missing design doc');
    console.log('   ✓ Error handling works correctly');
  }

  // Cleanup
  await db.destroy();

  console.log('\n🎉 All PouchDB v9.0.0 Compatibility Tests Passed!');
  console.log('✅ GeoPouch is fully compatible with PouchDB v9.0.0');
}

// Run the tests
if (require.main === module) {
  runCompatibilityTests().catch(err => {
    console.error('❌ Compatibility test failed:', err);
    process.exit(1);
  });
}

module.exports = runCompatibilityTests;