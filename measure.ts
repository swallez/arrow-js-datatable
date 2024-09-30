if (!global.gc) throw "GC not available. Run this script with `--expose-gc`";

const numberFormat = Intl.NumberFormat(undefined, { maximumFractionDigits: 0, signDisplay: "exceptZero" });
const timeFormat = Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

// See https://nodejs.org/api/process.html#processmemoryusage
var heapUsed = 0;
var arrayBuffers = 0;

class Measurement {
    id: string;
    time?: string;
    allocated_heap?: string;
    allocated_buffers?: string;
    retained_heap?: string;
    retained_buffers?: string;
    heap_total?: string;
    rss?: string;
}

const measurements = new Array<Measurement>();

const majorGc = { type: "major", execution: "sync" };
const minorGc = { type: "minor", execution: "sync" };

export function measure<T>(id: string, fn?: () => T): T {
    global.gc(majorGc);
    //global.gc(minorGc);

    const startMem = process.memoryUsage();
    const startTime = global.performance.now();

    const result = fn ? fn() : undefined;

    const duration = global.performance.now() - startTime;
    const allocatedMem = process.memoryUsage();

    global.gc(majorGc);
    //global.gc(minorGc);

    if (fn) {
        const retainedMem = process.memoryUsage();

        measurements.push({
            id: id,
            time: timeFormat.format(duration) + " ms",
            allocated_heap: formatMem(allocatedMem.heapUsed - startMem.heapUsed),
            allocated_buffers: formatMem(allocatedMem.arrayBuffers - startMem.arrayBuffers),
            retained_heap: formatMem(retainedMem.heapUsed - startMem.heapUsed),
            retained_buffers: formatMem(retainedMem.arrayBuffers - startMem.arrayBuffers),
            // heap_total: formatMem(retainedMem.heapTotal),
            // rss: formatMem(retainedMem.rss),
        })
    }

    return result;
}

function formatMem(mem: number): string {
    return numberFormat.format(mem/1024) + " kB";
}

export function seperator() {
    measurements.push({id: "------------------------"})
}

export function logReport() {
    console.table(measurements);
}
