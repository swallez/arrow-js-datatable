# arrow-js-datatable

This is a series of benchmarks of the Arrow/JS `Table` and the work on [the PR to improve its usage as a regular array of objects](https://github.com/apache/arrow/pull/44247).

The specific context is usage in Kibana that manipulates data as arrays of objects, to help towards using Arrow as the data transfer and in-memory representation, while avoiding some extensive refactoring needed to use dataframes natively.

## Getting started

Clone this repository, and the Arrow PR branch as a sibling directory:

```bash
git clone https://github.com/swallez/arrow-js-datatable.git
git clone -b improve-struct-row https://github.com/swallez/arrow.git
```

Build the Arrow branch and generate test data:

```bash
(cd arrow/js; yarn install && yarn build)

cd arrow-js-datatable
yarn install
yarn gen-data
```

Run the benchmark:

```bash
yarn benchmark
```

It outputs a report like this (run on an Apple M2). See code and comments in [`index.ts`](index.ts) to understand what each test does.

Memory values are captured by calling the Node.js garbage collector and measuring/comparing memory usage.

The "allocated" columns show the total amount or memory that was allocated while running a specific test. This value may not always be accurate if the GC decided to do some cleanup while running the test.

```
┌─────────┬────────────────────────────┬──────────────┬────────────────┬───────────────────┬───────────────┬──────────────────┐
│ (index) │ id                         │ time         │ allocated_heap │ allocated_buffers │ retained_heap │ retained_buffers │
├─────────┼────────────────────────────┼──────────────┼────────────────┼───────────────────┼───────────────┼──────────────────┤
│ 0       │ 'Baseline, do nothing'     │ '0.005 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 1       │ '------------------------' │              │                │                   │               │                  │
│ 2       │ 'Read json file'           │ '14.174 ms'  │ '+49,367 kB'   │ '+24,692 kB'      │ '+49,336 kB'  │ '0 kB'           │
│ 3       │ 'Parse json text'          │ '68.157 ms'  │ '+25,080 kB'   │ '0 kB'            │ '+26,351 kB'  │ '0 kB'           │
│ 4       │ 'Restructure json'         │ '1.602 ms'   │ '+8,260 kB'    │ '0 kB'            │ '+7,116 kB'   │ '0 kB'           │
│ 5       │ '------------------------' │              │                │                   │               │                  │
│ 6       │ 'Read json, all in one'    │ '98.067 ms'  │ '+83,007 kB'   │ '0 kB'            │ '+82,422 kB'  │ '0 kB'           │
│ 7       │ '------------------------' │              │                │                   │               │                  │
│ 8       │ 'Read arrow file'          │ '10.867 ms'  │ '+1 kB'        │ '+16,434 kB'      │ '0 kB'        │ '+16,434 kB'     │
│ 9       │ 'Create arrow table'       │ '4.539 ms'   │ '+2,136 kB'    │ '0 kB'            │ '+2,114 kB'   │ '0 kB'           │
│ 10      │ 'table.toArray()'          │ '6.23 ms'    │ '+13,533 kB'   │ '0 kB'            │ '+8,752 kB'   │ '0 kB'           │
│ 11      │ 'table.toArrayView()'      │ '0.043 ms'   │ '0 kB'         │ '0 kB'            │ '+1 kB'       │ '0 kB'           │
│ 12      │ 'table to object array'    │ '109.094 ms' │ '+51,104 kB'   │ '0 kB'            │ '+48,161 kB'  │ '0 kB'           │
│ 13      │ '------------------------' │              │                │                   │               │                  │
│ 14      │ 'toArray, all in one'      │ '9.147 ms'   │ '+15,394 kB'   │ '+16,434 kB'      │ '+10,286 kB'  │ '+16,434 kB'     │
│ 15      │ 'toArrayView, all in one'  │ '24.026 ms'  │ '+1,709 kB'    │ '+16,434 kB'      │ '+1,615 kB'   │ '+16,434 kB'     │
│ 16      │ '------------------------' │              │                │                   │               │                  │
│ 17      │ 'index loop, baseline'     │ '0.445 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 18      │ 'index loop, array[i]'     │ '0.549 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 19      │ 'index loop, arrayView[i]' │ '14.46 ms'   │ '+15,596 kB'   │ '0 kB'            │ '+2,335 kB'   │ '0 kB'           │
│ 20      │ '------------------------' │              │                │                   │               │                  │
│ 21      │ 'Iterator loop, baseline'  │ '1.102 ms'   │ '+4,114 kB'    │ '0 kB'            │ '+207 kB'     │ '0 kB'           │
│ 22      │ 'Iterator loop, array'     │ '1.354 ms'   │ '+3,907 kB'    │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 23      │ 'Iterator loop, arrayView' │ '3.836 ms'   │ '+10,160 kB'   │ '0 kB'            │ '+2 kB'       │ '0 kB'           │
└─────────┴────────────────────────────┴──────────────┴────────────────┴───────────────────┴───────────────┴──────────────────┘
```
