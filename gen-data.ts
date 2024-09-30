import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { tableFromJSON, tableToIPC } from 'apache-arrow';

function createRecord() {
    return {
        bool1: faker.datatype.boolean(),
        bool2: faker.datatype.boolean(),
        integer1: faker.number.int(),
        integer2: faker.number.int(),
        integer3: faker.number.int(),
        double1: faker.number.float(),
        double2: faker.number.float(),
        double3: faker.number.float(),
        text1: faker.string.alpha({length: {min: 20, max: 100}}),
        text2: faker.animal.dog(),
        keyword1: faker.animal.cat(),
        keyword2: faker.string.uuid(),
    }
}

export function generateData() {
    const count = 100000;
    console.log("Generating", count, "records");
    const array = faker.helpers.multiple(createRecord, {
        count: count,
    });

    const keys = Object.keys(array[0]);
    const types = keys.map(n => n.replace(/[0-9]+/, ""));

    const columns = keys.map((n, i) => { return {name: n, type: types[i]}});

    // ES|QL row format
    writeFileSync("esql.rows.json", JSON.stringify(
        { columns: columns, data: array.map(item => keys.map(key => item[key])) }
    ));

    // ES|QL column format
    writeFileSync("esql.columns.json", JSON.stringify(
        { columns: columns, data: keys.map(key => array.map(item => item[key])) }
    ));

    // Arrow
    const table = tableFromJSON(array);
    writeFileSync("esql.arrow", tableToIPC(table))
}

generateData();
