# GeoPouch v3.0.0 Migration Guide: PouchDB v9.0.0 Compatibility

## Overview

GeoPouch v3.0.0 has been updated to work with PouchDB v9.0.0, maintaining full backward compatibility for the spatial API while leveraging modern JavaScript features and removing deprecated dependencies.

## Breaking Changes

### ❌ Removed Dependencies
- **`lie` Promise Library**: Replaced with native JavaScript Promises
- **Node.js < 14**: Now requires Node.js 14+ for modern Promise support

### ✅ API Compatibility
- **Spatial Query API**: No changes to public API
- **Plugin Registration**: Works exactly the same way
- **Design Documents**: Full compatibility maintained
- **All Query Options**: `include_docs`, `stale`, etc. work unchanged

## Migration Steps

### 1. Update Dependencies

```bash
# Update package.json
npm install pouchdb@^9.0.0 geopouch@^3.0.0
```

### 2. Code Changes Required

**None!** The public API is completely backward compatible.

```javascript
// This code works exactly the same in v3.0.0
const PouchDB = require('pouchdb');
const GeoPouch = require('geopouch');

PouchDB.plugin(GeoPouch);

const db = new PouchDB('spatial-db');

// All existing queries work unchanged
const results = await db.spatial(function (doc) {
  emit(doc.geometry);
}, [[-71.1, 42.3], [-71.0, 42.4]]);
```

### 3. Development Environment Updates

```bash
# Update dev dependencies for modern tooling
npm install --save-dev mocha@^10.0.0 chai@^4.3.0 nyc@^15.1.0
```

## New Features in v3.0.0

### Modern JavaScript Support
- Native Promises instead of polyfills
- ES6 const/let usage internally
- Better error handling
- Improved type safety

### Enhanced Testing
- Comprehensive PouchDB v9.0.0 compatibility test suite
- Better error message reporting
- Performance regression testing

### Development Improvements
- ESLint configuration
- NYC code coverage
- Modern build tooling

## Compatibility Matrix

| GeoPouch Version | PouchDB Version | Node.js | Status |
|------------------|-----------------|---------|---------|
| v2.0.3 (Legacy)  | v6.0.0 - v8.x  | 8+      | Legacy |
| v3.0.0 (Current) | v9.0.0         | 14+     | ✅ Recommended |

## Testing Your Migration

Run the compatibility test suite to verify everything works:

```bash
# Install dependencies
npm install

# Run compatibility tests
node test-v9-compatibility.js

# Run full test suite
npm test
```

## Performance Improvements

PouchDB v9.0.0 brings several performance improvements that benefit GeoPouch:

- **IndexedDB Adapter**: Massively improved stability and performance
- **Query Optimization**: Better execution plans for spatial queries
- **Memory Management**: Reduced memory footprint for large datasets
- **Promise Performance**: Native promises are faster than polyfills

## Troubleshooting

### Common Issues

**Error: "Promise is not defined"**
- Solution: Update to Node.js 14+ which includes native Promise support

**Error: "Module not found: lie"**
- Solution: Update to GeoPouch v3.0.0 which removes the lie dependency

**Slow spatial queries**
- Solution: PouchDB v9.0.0 has better IndexedDB performance - queries should be faster

**Test failures**
- Solution: Update test dependencies and use the new compatibility test suite

### Getting Help

1. Run the compatibility test suite: `node test-v9-compatibility.js`
2. Check the [PouchDB v9.0.0 changelog](https://github.com/pouchdb/pouchdb/releases/tag/9.0.0)
3. File issues at the [GeoPouch repository](https://github.com/calvinmetcalf/geopouch/issues)

## Rollback Plan

If you need to rollback to the legacy version:

```bash
npm install pouchdb@^6.0.0 geopouch@^2.0.3
```

Note: We recommend staying on the modern stack for security updates and performance improvements.