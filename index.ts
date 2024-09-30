

import { readFileSync, existsSync } from 'fs';
import { tableFromIPC, Table } from 'apache-arrow';
import {logReport, measure, seperator } from "./measure";

const fileName = "esql.arrow";
if (!existsSync(fileName)) {
    console.log("Data missing. Run 'yarn gen-data' first");
    process.exit(1);
}

measure("Startup");
measure("Startup");
measure("Startup");
measure("Startup");

measure("Baseline, do nothing", () => {}); // Check that all works fine
seperator();

//-------------------------------------------------------------------------------------------------
// Existing ES|QL data deserialization: read raw json data, and restructure it as an array of objects

let jsonText = measure("Read json file", () =>
    readFileSync("esql.columns.json").toString()
);

let json = measure("Parse json text", () =>
    JSON.parse(jsonText)
);

// Restructured json will allocate the array and object, and reuse data objects
// created in the previous phase.
const jsonData = measure("Restructure json", () => {
    const jsArray = [];
    for (let i = 0; i < json.data[0].length; i++) {
        jsArray.push({});
    }
    json.columns.forEach((field, colIdx) => {
        for (let i = 0; i < json.columns.length; i++) {
            jsArray[i][field.name] = json.data[colIdx][i];
        }
    });
    return jsArray;
});

seperator();

// All in one to illustrate the total retained memory of the final array
const jsonData2 = measure("Read json, all in one", () => {
    let jsonText = readFileSync("esql.columns.json").toString();
    let json = JSON.parse(jsonText);
    const jsArray = [];
    for (let i = 0; i < json.data[0].length; i++) {
        jsArray.push({});
    }
    json.columns.forEach((field, colIdx) => {
        for (let i = 0; i < json.columns.length; i++) {
            jsArray[i][field.name] = json.data[colIdx][i];
        }
    });
    return jsArray;
});

//-------------------------------------------------------------------------------------------------
// Read the Arrow dataframe, and create various array representations

seperator();

const arrowBuffer: Buffer = measure("Read arrow file", () =>
    readFileSync(fileName)
);

const table: Table = measure("Create arrow table", () =>
    tableFromIPC(arrowBuffer)
);

const foo = table.get(0);

const numRows = table.numRows;
console.log("datafame rows:", numRows);

console.log();

const array = measure("table.toArray()", () =>
    table.toArray()
);

const arrayView = measure("table.toArrayView()", () =>
    table.toArrayView()
);

const jsArray = measure("table to object array", () => {
    // Deep copy of table to an array of new JS objects
    const jsArray = [];
    for (let i = 0; i < table.numRows; i++) {
        jsArray.push({});
    }
    table.schema.fields.forEach((field) => {
        const child = table.getChild(field.name)!;
        for (let i = 0; i < table.numRows; i++) {
            jsArray[i][field.name] = child.get(i);
        }
    });
    return jsArray;
})

seperator();
measure("Read arrow, all in one", () => {
    const arrowBuffer = readFileSync(fileName);
    const table = tableFromIPC(arrowBuffer)
    return table.toArrayView();
})

//-------------------------------------------------------------------------------------------------
// Iterate on the dataframe using array indexed access

seperator();
// An empty loop
measure("index loop, baseline", () => {
    let x: number;
    for (let i = 0; i < numRows; i++) {
        x = i;
    }
});

// Fastest, we don't have to search the location in the various batches
measure("index loop, array[i]", () => {
    let x: any;
    for (var i = 0; i < numRows; i++) {
        x = array[i % array.length];
    }
});

// Delegates to the table, that searches in the batch collection
measure("index loop, arrayView[i]", () => {
    let x: any;
    for (let i = 0; i < numRows; i++) {
        x = array[i % arrayView.length];
    }
});

//-------------------------------------------------------------------------------------------------
// Iterate on the dataframe using iterators

seperator();

// Empty loop on an array with as many elements as the table
let keys = array.keys();
let count = measure("Iterator loop, baseline", () => {
    let i = 0;
    for (let item of keys) {
        i++;
    }
    return i;
})
console.log("Iterator loop, keys cout", count);

count = measure("Iterator loop, array", () => {
    let i = 0;
    for (let item of array) {
        i++;
    }
    return i;
})
console.log("Iterator loop, array count", count);

// Array view returns the table iterator
count = measure("Iterator loop, arrayView", () => {
    let i = 0;
    for (let item of arrayView) {
        i++;
    }
    return i;
})
console.log("Iterator loop, arrayView count", count);


logReport();
