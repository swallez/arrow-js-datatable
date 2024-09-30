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
│ 0       │ 'Baseline, do nothing'     │ '0.008 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 1       │ '------------------------' │              │                │                   │               │                  │
│ 2       │ 'Read json file'           │ '15.618 ms'  │ '+49,400 kB'   │ '+24,708 kB'      │ '+49,400 kB'  │ '0 kB'           │
│ 3       │ 'Parse json text'          │ '92.617 ms'  │ '+24,942 kB'   │ '0 kB'            │ '+26,213 kB'  │ '0 kB'           │
│ 4       │ 'Restructure json'         │ '1.736 ms'   │ '+8,412 kB'    │ '0 kB'            │ '+7,267 kB'   │ '0 kB'           │
│ 5       │ '------------------------' │              │                │                   │               │                  │
│ 6       │ 'Read json, all in one'    │ '97.28 ms'   │ '+83,068 kB'   │ '0 kB'            │ '+82,486 kB'  │ '0 kB'           │
│ 7       │ '------------------------' │              │                │                   │               │                  │
│ 8       │ 'Read arrow file'          │ '3.701 ms'   │ '+1 kB'        │ '+16,451 kB'      │ '0 kB'        │ '+16,451 kB'     │
│ 9       │ 'Create arrow table'       │ '3.42 ms'    │ '+1,926 kB'    │ '0 kB'            │ '+1,841 kB'   │ '0 kB'           │
│ 10      │ 'table.toArray()'          │ '5.924 ms'   │ '+13,853 kB'   │ '0 kB'            │ '+8,910 kB'   │ '0 kB'           │
│ 11      │ 'table.toArrayView()'      │ '0.039 ms'   │ '0 kB'         │ '0 kB'            │ '-31 kB'      │ '0 kB'           │
│ 12      │ 'table to object array'    │ '106.253 ms' │ '+51,027 kB'   │ '0 kB'            │ '+48,010 kB'  │ '0 kB'           │
│ 13      │ '------------------------' │              │                │                   │               │                  │
│ 14      │ 'Read arrow, all in one'   │ '3.831 ms'   │ '+1,680 kB'    │ '+16,451 kB'      │ '+1,615 kB'   │ '+16,451 kB'     │
│ 15      │ '------------------------' │              │                │                   │               │                  │
│ 16      │ 'index loop, baseline'     │ '0.457 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 17      │ 'index loop, array[i]'     │ '0.712 ms'   │ '0 kB'         │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 18      │ 'index loop, arrayView[i]' │ '4.247 ms'   │ '+9,377 kB'    │ '0 kB'            │ '+2 kB'       │ '0 kB'           │
│ 19      │ '------------------------' │              │                │                   │               │                  │
│ 20      │ 'Iterator loop, baseline'  │ '1.114 ms'   │ '+3,907 kB'    │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 21      │ 'Iterator loop, array'     │ '1.281 ms'   │ '+3,907 kB'    │ '0 kB'            │ '0 kB'        │ '0 kB'           │
│ 22      │ 'Iterator loop, arrayView' │ '4.751 ms'   │ '+10,360 kB'   │ '0 kB'            │ '+64 kB'      │ '0 kB'           │
└─────────┴────────────────────────────┴──────────────┴────────────────┴───────────────────┴───────────────┴──────────────────┘
```
