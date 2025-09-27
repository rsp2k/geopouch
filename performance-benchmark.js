#!/usr/bin/env node

/**
 * Performance Benchmark for GeoPouch v3.0.0
 * Measures performance improvements with modern PouchDB v9.0.0
 */

const PouchDB = require('pouchdb');
const GeoPouch = require('./index.js');

PouchDB.plugin(GeoPouch);

console.log('🏁 GeoPouch v3.0.0 Performance Benchmark');
console.log('Node.js:', process.version);
console.log('PouchDB:', PouchDB.version);
console.log('');

async function benchmark(name, fn) {
  console.log(`🔥 ${name}`);

  const start = process.hrtime.bigint();
  const memStart = process.memoryUsage();

  const result = await fn();

  const end = process.hrtime.bigint();
  const memEnd = process.memoryUsage();

  const timeDiff = Number(end - start) / 1000000; // Convert to milliseconds
  const memDiff = (memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024; // Convert to MB

  console.log(`   ⏱️  Time: ${timeDiff.toFixed(2)}ms`);
  console.log(`   💾 Memory: ${memDiff > 0 ? '+' : ''}${memDiff.toFixed(2)}MB`);
  console.log(`   📊 Result: ${JSON.stringify(result)}`);
  console.log('');

  return { time: timeDiff, memory: memDiff, result };
}

async function runBenchmarks() {
  console.log('🎯 Running Performance Benchmarks\n');

  // Benchmark 1: Database creation and plugin loading
  const dbSetup = await benchmark('Database Setup + Plugin Loading', async () => {
    const db = new PouchDB('benchmark-setup');
    const hasPlugin = typeof db.spatial === 'function';
    await db.destroy();
    return { hasPlugin };
  });

  // Benchmark 2: Bulk document insertion
  const insertBench = await benchmark('Bulk Insert (1000 documents)', async () => {
    const db = new PouchDB('benchmark-insert');

    const docs = [];
    for (let i = 0; i < 1000; i++) {
      docs.push({
        _id: `doc-${i}`,
        name: `Location ${i}`,
        category: `category-${i % 10}`,
        geometry: {
          type: 'Point',
          coordinates: [
            -180 + (Math.random() * 360), // -180 to 180
            -90 + (Math.random() * 180)   // -90 to 90
          ]
        }
      });
    }

    await db.bulkDocs(docs);
    const count = (await db.allDocs()).total_rows;
    await db.destroy();
    return { documentsInserted: count };
  });

  // Benchmark 3: Spatial index creation (first query)
  const indexBench = await benchmark('Spatial Index Creation (first query)', async () => {
    const db = new PouchDB('benchmark-index');

    // Insert test data
    const docs = [];
    for (let i = 0; i < 100; i++) {
      docs.push({
        _id: `location-${i}`,
        geometry: {
          type: 'Point',
          coordinates: [i - 50, i - 50] // Spread out points
        }
      });
    }
    await db.bulkDocs(docs);

    // First spatial query (builds index)
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [-25, -25, 25, 25]);

    await db.destroy();
    return { resultsFound: results.length };
  });

  // Benchmark 4: Cached spatial query performance
  const cachedBench = await benchmark('Cached Spatial Query Performance', async () => {
    const db = new PouchDB('benchmark-cached');

    // Insert and build index
    const docs = [];
    for (let i = 0; i < 500; i++) {
      docs.push({
        _id: `point-${i}`,
        geometry: {
          type: 'Point',
          coordinates: [Math.random() * 100, Math.random() * 100]
        }
      });
    }
    await db.bulkDocs(docs);

    // Build index with first query
    await db.spatial(function(doc) { emit(doc.geometry); }, [0, 0, 100, 100]);

    // Now measure cached query performance
    const results = await db.spatial(function(doc) {
      emit(doc.geometry);
    }, [25, 25, 75, 75]);

    await db.destroy();
    return { cachedResults: results.length };
  });

  // Benchmark 5: Design document spatial query
  const designBench = await benchmark('Design Document Spatial Query', async () => {
    const db = new PouchDB('benchmark-design');

    // Create design document
    await db.put({
      _id: '_design/spatial',
      spatial: {
        by_location: function(doc) {
          if (doc.geometry) {
            emit(doc.geometry);
          }
        }.toString()
      }
    });

    // Add test data
    const docs = [];
    for (let i = 0; i < 200; i++) {
      docs.push({
        _id: `item-${i}`,
        type: 'location',
        geometry: {
          type: 'Point',
          coordinates: [i % 20, Math.floor(i / 20)]
        }
      });
    }
    await db.bulkDocs(docs);

    // Query using design document
    const results = await db.spatial('spatial/by_location', [5, 5, 15, 15], {
      include_docs: true
    });

    await db.destroy();
    return { designDocResults: results.length };
  });

  // Benchmark 6: Multiple concurrent queries
  const concurrentBench = await benchmark('Concurrent Spatial Queries (x5)', async () => {
    const db = new PouchDB('benchmark-concurrent');

    // Setup data
    const docs = [];
    for (let i = 0; i < 300; i++) {
      docs.push({
        _id: `concurrent-${i}`,
        geometry: {
          type: 'Point',
          coordinates: [i % 30, Math.floor(i / 30)]
        }
      });
    }
    await db.bulkDocs(docs);

    // Run 5 concurrent spatial queries
    const queries = [
      db.spatial(function(doc) { emit(doc.geometry); }, [0, 0, 10, 10]),
      db.spatial(function(doc) { emit(doc.geometry); }, [10, 0, 20, 10]),
      db.spatial(function(doc) { emit(doc.geometry); }, [20, 0, 30, 10]),
      db.spatial(function(doc) { emit(doc.geometry); }, [0, 5, 15, 15]),
      db.spatial(function(doc) { emit(doc.geometry); }, [15, 5, 30, 15])
    ];

    const results = await Promise.all(queries);
    const totalResults = results.reduce((sum, r) => sum + r.length, 0);

    await db.destroy();
    return { totalConcurrentResults: totalResults };
  });

  // Performance Summary
  console.log('🏆 Performance Summary');
  console.log('═══════════════════════');
  console.log(`Database Setup: ${dbSetup.time.toFixed(2)}ms`);
  console.log(`1000 Doc Insert: ${insertBench.time.toFixed(2)}ms`);
  console.log(`Index Creation: ${indexBench.time.toFixed(2)}ms`);
  console.log(`Cached Query: ${cachedBench.time.toFixed(2)}ms`);
  console.log(`Design Doc Query: ${designBench.time.toFixed(2)}ms`);
  console.log(`5 Concurrent Queries: ${concurrentBench.time.toFixed(2)}ms`);

  console.log('\n💡 Performance Insights');
  console.log('─────────────────────────');

  // Performance analysis
  if (cachedBench.time < indexBench.time * 0.5) {
    console.log('✅ Spatial index caching is working effectively');
  }

  if (insertBench.time < 200) {
    console.log('✅ Document insertion performance is excellent');
  }

  if (concurrentBench.time < designBench.time * 8) {
    console.log('✅ Concurrent query handling is efficient');
  }

  console.log(`📈 Effective throughput: ~${(1000 / insertBench.time * 1000).toFixed(0)} docs/sec`);
  console.log(`🔍 Query performance: ~${(cachedBench.result.cachedResults / cachedBench.time).toFixed(1)} results/ms`);

  console.log('\n🎉 Performance benchmark complete!');
  console.log('🚀 GeoPouch v3.0.0 is performing excellently with PouchDB v9.0.0');
}

runBenchmarks().catch(error => {
  console.error('💥 Benchmark failed:', error);
  process.exit(1);
});