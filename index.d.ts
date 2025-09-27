declare module 'geopouch' {
  interface BoundingBox {
    // Single array format: [xmin, ymin, xmax, ymax]
    // Or nested array format: [[mins], [maxs]]
    // Or N-dimensional coordinates
  }

  type BBoxFormat =
    | [number, number, number, number] // 2D: [xmin, ymin, xmax, ymax]
    | [[number, number], [number, number]] // 2D nested: [[xmin, ymin], [xmax, ymax]]
    | [[number, number, number], [number, number, number]] // 3D nested
    | [number, number, number] // Point format for min
    | number[] // Generic N-dimensional

  interface SpatialOptions {
    include_docs?: boolean
    stale?: boolean
  }

  interface SpatialResult {
    id: string
    bboxen: number[][]
    doc?: any
  }

  type EmitFunction = (geometry: any) => void
  type SpatialFunction = (doc: any, emit: EmitFunction) => void

  interface PouchDBSpatial {
    spatial(
      fun: SpatialFunction | string,
      bbox: BBoxFormat,
      options?: SpatialOptions,
      callback?: (error: any, result: SpatialResult[]) => void,
      callback2?: (error: any, result: SpatialResult[]) => void
    ): Promise<SpatialResult[]>

    spatial(
      fun: SpatialFunction | string,
      bbox1: BBoxFormat,
      bbox2: BBoxFormat,
      options?: SpatialOptions,
      callback?: (error: any, result: SpatialResult[]) => void
    ): Promise<SpatialResult[]>
  }

  export interface GeoPouchPlugin {
    spatial: PouchDBSpatial['spatial']
  }

  export function spatial(
    fun: SpatialFunction | string,
    bbox: BBoxFormat,
    options?: SpatialOptions,
    callback?: (error: any, result: SpatialResult[]) => void,
    callback2?: (error: any, result: SpatialResult[]) => void
  ): Promise<SpatialResult[]>

  // Plugin export for PouchDB.plugin()
  const plugin: {
    spatial: typeof spatial
  }

  export default plugin
}

declare module 'pouchdb' {
  interface Database {
    spatial(
      fun: import('geopouch').SpatialFunction | string,
      bbox: import('geopouch').BBoxFormat,
      options?: import('geopouch').SpatialOptions,
      callback?: (error: any, result: import('geopouch').SpatialResult[]) => void,
      callback2?: (error: any, result: import('geopouch').SpatialResult[]) => void
    ): Promise<import('geopouch').SpatialResult[]>
  }
}