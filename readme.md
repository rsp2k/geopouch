# GeoPouch v3.0.0 🌍

[![CI](https://github.com/rsp2k/geopouch/workflows/CI/badge.svg)](https://github.com/rsp2k/geopouch/actions)
[![npm version](https://badge.fury.io/js/geopouch.svg)](https://badge.fury.io/js/geopouch)
[![Node.js Version](https://img.shields.io/node/v/geopouch.svg)](https://nodejs.org/)

**High-performance spatial indexing for PouchDB v9.0.0** - Add geospatial capabilities to your offline-first applications.

> **Modernized in 2024**: Complete rewrite for PouchDB v9.0.0 compatibility with native Promises, ES6+ syntax, and 25,000+ docs/sec performance.

Originally by [@vmx](https://github.com/vmx) with contributions by [@daleharvey](https://github.com/daleharvey) and [@calvinmetcalf](https://github.com/calvinmetcalf). Modernized and maintained by [@rsp2k](https://github.com/rsp2k).

## 🎯 When to Use GeoPouch v3.0.0

### **Perfect For These Use Cases:**

#### 🚀 **Simple Bounding Box Applications**
- **Asset tracking** - Find all vehicles/equipment within a geographic area
- **Proximity searches** - "Show all stores within 5km radius" (converted to bbox)
- **Map viewport queries** - Load only points visible in current map view
- **Geofencing** - Simple rectangular boundary checking

#### 📱 **High-Performance Bulk Operations**
- **GPS data logging** - Fast insertion of thousands of location points
- **Time-series spatial data** - Efficient storage and querying of location history
- **Real-time tracking** - Sub-100ms queries for moving objects
- **Data synchronization** - Bulk spatial data replication with CouchDB

#### 🛠️ **Legacy PouchDB Integration**
- **Existing PouchDB codebases** that need basic spatial capabilities
- **Minimal dependency projects** - Only requires async-rtree
- **N-dimensional data** - Beyond just lat/lng (elevation, time, etc.)
- **Design document compatibility** - Persistent spatial views

### **Technical Advantages:**

#### ⚡ **Performance Optimized**
- **25,000+ documents/second** insertion speed
- **Sub-100ms spatial queries** on indexed data
- **Efficient R-tree indexing** for bounding box queries
- **Memory-optimized** for mobile and resource-constrained devices

#### 🔄 **Seamless Integration**
- **PouchDB v9.0.0 compatible** with latest features
- **Native Promise support** for modern async/await patterns
- **Node.js 14+ support** with ES6+ syntax
- **Browser and Node.js** dual compatibility

#### 🎲 **Flexible Spatial Queries**
- **Multiple bounding box formats** for different coordinate systems
- **N-dimensional coordinates** support beyond just lat/lng
- **Design document integration** for persistent spatial views
- **Include docs option** for full document retrieval

### **Choose GeoPouch When You Need:**

✅ **Simple bounding box queries** (rectangular areas only)
✅ **Maximum performance** for bulk spatial operations (25K+ docs/sec)
✅ **Minimal dependencies** (just async-rtree)
✅ **N-dimensional spatial data** (not just lat/lng)
✅ **Legacy PouchDB compatibility** with existing codebases
✅ **Design document spatial views** for persistent indexes

### **Consider Alternatives When You Need:**

#### 🆚 **Modern PouchDB Spatial Alternatives**
❌ **Advanced spatial predicates** (contains, intersects, within, etc.) → Use [pouchdb-geospatial](https://github.com/dpmcmlxxvi/pouchdb-geospatial) (more modern, DE-9IM based)
❌ **GeoJSON-first approach** with complex spatial relationships → Use [pouchdb-geospatial](https://github.com/dpmcmlxxvi/pouchdb-geospatial)

#### 🆚 **Non-PouchDB Alternatives**
❌ **Pure performance** over PouchDB compatibility → Use [Flatbush](https://github.com/mourner/flatbush) or [GeoKDBush](https://github.com/mourner/geokdbush)
❌ **Modern reactive patterns** → Use [RxDB](https://rxdb.info/) with spatial plugins
❌ **React Native optimization** → Use [WatermelonDB](https://github.com/Nozbe/WatermelonDB)
❌ **Server-side spatial** → Use PostgreSQL + PostGIS

### **🎯 GeoPouch vs. pouchdb-geospatial**

| Feature | GeoPouch v3.0.0 | pouchdb-geospatial |
|---------|------------------|-------------------|
| **Best For** | Bounding box queries, legacy compatibility | Complex spatial relationships, modern GeoJSON |
| **Query Types** | Bounding box only | 10 spatial predicates (contains, intersects, etc.) |
| **API Style** | Simple spatial() function | Method-per-predicate (.contains(), .within()) |
| **Dependencies** | Minimal (async-rtree) | More (RBush, Turf, de9im) |
| **Maintenance** | Modernized 2024 | Active (last update 2022) |
| **Use Case** | Fast bbox queries, N-dimensional | Complex spatial analysis, GeoJSON-centric |

## 📦 Installation

```bash
npm install geopouch pouchdb
```

```javascript
const PouchDB = require('pouchdb');
const GeoPouch = require('geopouch');

PouchDB.plugin(GeoPouch);
```

## 🚀 Quick Start

```javascript
const db = new PouchDB('my-spatial-db');

// Insert spatial documents
await db.bulkDocs([
  {
    _id: 'location1',
    name: 'Coffee Shop',
    geometry: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // [longitude, latitude]
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

// Query by bounding box
const results = await db.spatial(function(doc) {
  if (doc.geometry) {
    emit(doc.geometry);
  }
}, [-122.5, 37.7, -122.3, 37.8]); // [west, south, east, north]

console.log(`Found ${results.length} locations in area`);
```

## 📖 API Reference

### Basic Usage

```javascript
// Plugin registration
PouchDB.plugin(require('geopouch'));

// Function-based queries (temporary spatial view)
const results = await db.spatial(function (doc) {
  if (doc.geometry) {
    emit(doc.geometry);
  }
}, [xmin, ymin, xmax, ymax], options);

// Design document queries (persistent spatial view)
const results = await db.spatial('ddoc/functionName', [xmin, ymin, xmax, ymax], options);
```

### Bounding Box Formats

GeoPouch supports multiple bounding box formats:

```javascript
// 1. Single array with 4 numbers [xmin, ymin, xmax, ymax]
await db.spatial(mapFn, [-122.5, 37.7, -122.3, 37.8]);

// 2. Nested arrays [[mins], [maxs]]
await db.spatial(mapFn, [[-122.5, 37.7], [-122.3, 37.8]]);

// 3. Two separate arrays (mins, maxs)
await db.spatial(mapFn, [-122.5, 37.7], [-122.3, 37.8]);

// 4. N-dimensional coordinates
await db.spatial(mapFn, [-122.5, 37.7, 0], [-122.3, 37.8, 100]); // with elevation
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include_docs` | boolean | false | Include full documents in results |
| `stale` | boolean | false | Allow stale index reads for better performance |

### Examples

```javascript
// Include full documents
const results = await db.spatial(mapFn, bbox, { include_docs: true });
results.forEach(row => {
  console.log(row.doc.name); // Access full document
});

// Performance mode with stale reads
const results = await db.spatial(mapFn, bbox, { stale: true });
```

## 🛠️ Development

### Requirements
- Node.js 14+
- PouchDB v9.0.0+

### Scripts
```bash
npm test          # Run unit tests
npm run test:unit # Same as npm test
npm run test:legacy # Legacy compatibility tests
npm run test-coverage # Test with coverage report
npm run build     # Build browser bundle
npm run lint      # Code linting
npm run size      # Check bundle size
```

### Performance Benchmarks
- **Insert Performance**: 25,000+ documents/second
- **Query Performance**: Sub-100ms for indexed bounding box queries
- **Bundle Size**: ~553KB (includes dependencies)

## 📄 License

Apache-2.0 - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

---

**⚡ Need complex spatial relationships?** Consider [pouchdb-geospatial](https://github.com/dpmcmlxxvi/pouchdb-geospatial) for advanced spatial predicates like intersects, contains, within, etc.
