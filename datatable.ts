/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

//import type { SerializableRecord } from '@kbn/utility-types';
import { map, pick, zipObject } from 'lodash';
import { Table, tableFromJSON } from 'apache-arrow';
//import type { SerializedFieldFormat } from '@kbn/field-formats-plugin/common';

//import { ExpressionTypeDefinition, ExpressionValueBoxed } from '../types';
//import { PointSeries, PointSeriesColumn } from './pointseries';
//import { ExpressionValueRender } from './render';

export type ExpressionValueBoxed = any;
export type ExpressionValueUnboxed = any;
export type SerializedFieldFormat = any;

export interface SerializableRecord extends Record<string, Serializable> {}
export type Serializable = any;

export type ExpressionTypeDefinition<
    Name extends string,
    Value extends ExpressionValueUnboxed | ExpressionValueBoxed,
    SerializedType = undefined
> = any;

type ExpressionValueRender<T> = any;

export type PointSeries = any;
export type PointSeriesColumn = any;

const name = 'datatable';

/**
 * A Utility function that Typescript can use to determine if an object is a Datatable.
 * @param datatable
 */
export const isDatatable = (datatable: unknown): datatable is Datatable =>
    (datatable as ExpressionValueBoxed | undefined)?.type === 'datatable';

/**
 * This type represents the `type` of any `DatatableColumn` in a `Datatable`.
 * its duplicated from KBN_FIELD_TYPES
 */
export type DatatableColumnType =
    | '_source'
    | 'attachment'
    | 'boolean'
    | 'date'
    | 'geo_point'
    | 'geo_shape'
    | 'ip'
    | 'murmur3'
    | 'number'
    | 'string'
    | 'unknown'
    | 'conflict'
    | 'object'
    | 'nested'
    | 'histogram'
    | 'null';

/**
 * This type represents a row in a `Datatable`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DatatableRow = Record<string, any>;

/**
 * Datatable column meta information
 */
export interface DatatableColumnMeta {
    /**
     * The Kibana normalized type of the column
     */
    type: DatatableColumnType;
    /**
     * The original type of the column from ES
     */
    esType?: string;
    /**
     * field this column is based on
     */
    field?: string;
    /**
     * index/table this column is based on
     */
    index?: string;
    /**
     * names the domain this column represents
     */
    dimensionName?: string;
    /**
     * serialized field format
     */
    params?: SerializedFieldFormat;
    /**
     * source function that produced this column
     */
    source?: string;
    /**
     * any extra parameters for the source that produced this column
     */
    sourceParams?: SerializableRecord;
}

/**
 * This type represents the shape of a column in a `Datatable`.
 */
export interface DatatableColumn {
    id: string;
    name: string;
    meta: DatatableColumnMeta;
    isNull?: boolean;
}

/**
 * Metadata with statistics about the `Datatable` source.
 */
export interface DatatableMetaStatistics {
    /**
     * Total hits number returned for the request generated the `Datatable`.
     */
    totalCount?: number;
}

/**
 * The `Datatable` meta information.
 */
export interface DatatableMeta {
    /**
     * Statistics about the `Datatable` source.
     */
    statistics?: DatatableMetaStatistics;

    /**
     * The `Datatable` type (e.g. `essql`, `eql`, `esdsl`, etc.).
     */
    type?: string;

    /**
     * The `Datatable` data source.
     */
    source?: string;

    [key: string]: unknown;
}

/**
 * A `Datatable` in Canvas is a unique structure that represents tabulated data.
 */
export interface Datatable {
    type: typeof name;
    columns: DatatableColumn[];
    meta?: DatatableMeta;
    rows: DatatableRow[];
    warning?: string;
}

export interface SerializedDatatable extends Datatable {
    rows: string[][];
}

interface RenderedDatatable {
    datatable: Datatable;
    paginate: boolean;
    perPage: number;
    showHeader: boolean;
}

export const datatable: ExpressionTypeDefinition<typeof name, Datatable, SerializedDatatable> = {
    name,
    validate: (table: Record<string, unknown>) => {
        // TODO: Check columns types. Only string, boolean, number, date, allowed for now.
        if (!table.columns) {
            throw new Error('datatable must have a columns array, even if it is empty');
        }

        if (!table.rows) {
            throw new Error('datatable must have a rows array, even if it is empty');
        }
    },
    serialize: (table) => {
        const { columns, rows } = table;
        return {
            ...table,
            rows: rows.map((row) => {
                return columns.map((column) => row[column.name]);
            }),
        };
    },
    deserialize: (table) => {
        const { columns, rows } = table;
        return {
            ...table,
            rows: rows.map((row) => {
                return zipObject(map(columns, 'name'), row);
            }),
        };
    },
    from: {
        null: () => ({
            type: name,
            meta: {},
            rows: [],
            columns: [],
        }),
        pointseries: (value: PointSeries) => ({
            type: name,
            meta: {},
            rows: value.rows,
            columns: map(value.columns, (val: PointSeriesColumn, colName) => {
                return { id: colName, name: val.expression, meta: { type: val.type } };
            }),
        }),
        arrow: (value: { type: 'arrow'; table: Table }): Datatable => {
            const jsArray = [];

            console.time('todataset');
            // slowest, walks over each row and gets values for all columns
            // for (let i = 0; i < value.table.numRows; i++) {
            //   const row = value.table.get(i)!;
            //   const newRow: Record<string, unknown> = {};
            //   value.table.schema.fields.forEach((field) => {
            //     newRow[field.name] = row[field.name];
            //   });
            //   jsArray.push({ ...newRow });
            // }

            // a bit faster, accesses the column first and then gets the value for the row
            // for (let i = 0; i < value.table.numRows; i++) {
            //   const newRow: Record<string, unknown> = {};
            //   value.table.schema.fields.forEach((field) => {
            //     newRow[field.name] = value.table.getChild(field.name)!.get(i);
            //   });
            //   jsArray.push({ ...newRow });
            // }

            // fastest, fill jsarray column by column
            for (let i = 0; i < value.table.numRows; i++) {
                jsArray.push({});
            }
            value.table.schema.fields.forEach((field) => {
                const child = value.table.getChild(field.name)!;
                for (let i = 0; i < value.table.numRows; i++) {
                    jsArray[i][field.name] = child.get(i);
                }
            });

            // use built in method to convert whole row, slow
            // for (let i = 0; i < value.table.numRows; i++) {
            //   const row = value.table.get(i)!;
            //   jsArray.push(row.toJSON());
            // }

            console.timeEnd('todataset');

            return {
                type: 'datatable',
                columns: value.table.schema.fields.map((field) => {
                    const meta: Record<string, unknown> = {};

                    console.time('fromdatatable');
                    for (const key in field.metadata.keys()) {
                        if (field.metadata.has(key)) {
                            meta[key] = field.metadata.get(key);
                        }
                    }
                    console.timeEnd('fromdatatable');

                    return {
                        id: field.name,
                        name: field.name,
                        type: field.type,
                        meta: {
                            type: field.type,
                            ...meta,
                        },
                    };
                }),
                rows: jsArray,
            };
        },
    },
    to: {
        render: (table): ExpressionValueRender<RenderedDatatable> => ({
            type: 'render',
            as: 'table',
            value: {
                datatable: table,
                paginate: true,
                perPage: 10,
                showHeader: true,
            },
        }),
        pointseries: (table: Datatable): PointSeries => {
            const validFields = ['x', 'y', 'color', 'size', 'text'];
            const columns = table.columns.filter((column) => validFields.includes(column.id));
            const rows = table.rows.map((row) => pick(row, validFields));
            return {
                type: 'pointseries',
                columns: columns.reduce<Record<string, PointSeries['columns']>>((acc, column) => {
                    acc[column.name] = {
                        type: column.meta.type,
                        expression: column.name,
                        role: 'dimension',
                    };
                    return acc;
                }, {}),
                rows,
            };
        },
        arrow: (value: Datatable): { type: 'arrow'; table: Table } => {
            const table = tableFromJSON(value.rows);
            table.schema.fields.forEach((field, i) => {
                Object.keys(value.columns[i].meta).forEach((key) => {
                    // @ts-ignore
                    field.metadata.set(key, value.columns[i].meta[key]);
                });
            });
            return { type: 'arrow', table };
        },
    },
};
