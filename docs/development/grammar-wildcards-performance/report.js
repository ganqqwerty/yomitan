/* global Chart */

const colors = {blue: '#176b87', orange: '#d87835', grid: 'rgba(23, 32, 42, 0.10)', text: '#49545e'};
const entryCount = {labels: ['0', '1', '3', '5', '10', '20', '50', '100'], off: [1.5, 1.5, 1.5, 1.7, 1.6, 1.6, 1.9, 2.0], on: [3.1, 2.8, 2.9, 3.2, 3.5, 3.2, 3.5, 4.0]};
const scanLength = {labels: ['16', '32', '64', '96'], off: [1.0, 2.8, 7.5, 12.8], on: [2.0, 5.3, 14.1, 26.3], requests: [52, 144, 396, 652]};
const definitionSize = {labels: ['256 B', '1 KiB', '5 KiB', '20 KiB'], off: [1.5, 1.6, 1.7, 1.6], on: [3.2, 3.3, 3.3, 3.4]};
const naturalExamples = {labels: ['Short · 32 chars', 'Long clause · 70 chars', 'Two のに endings · 41 chars'], off: [5.5, 11.3, 6.3], on: [8.2, 19.6, 10.3]};

function dataset(label, data, color) {
    return {label, data, borderColor: color, backgroundColor: color, borderWidth: 2, pointBackgroundColor: color, pointRadius: 4, pointHoverRadius: 6, tension: 0.25, fill: false};
}

function baseOptions(xTitle, yTitle = 'Median lookup time (ms)') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        plugins: {
            legend: {position: 'bottom', labels: {boxWidth: 12, boxHeight: 12, color: colors.text, padding: 18}},
            tooltip: {callbacks: {label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ms`}},
        },
        scales: {
            x: {grid: {display: false}, title: {display: true, text: xTitle, color: colors.text}, ticks: {color: colors.text}},
            y: {beginAtZero: true, grid: {color: colors.grid}, title: {display: true, text: yTitle, color: colors.text}, ticks: {color: colors.text}},
        },
    };
}

function makeLineChart(id, source, xTitle) {
    return new Chart(document.getElementById(id), {
        type: 'line',
        data: {labels: source.labels, datasets: [dataset('Feature off', source.off, colors.blue), dataset('Feature on', source.on, colors.orange)]},
        options: baseOptions(xTitle),
    });
}

function fillTable(id, headings, rows) {
    const table = document.getElementById(id);
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const heading of headings) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = heading;
        headerRow.append(cell);
    }
    thead.append(headerRow);
    const tbody = document.createElement('tbody');
    for (const row of rows) {
        const tableRow = document.createElement('tr');
        for (const value of row) {
            const cell = document.createElement('td');
            cell.textContent = value;
            tableRow.append(cell);
        }
        tbody.append(tableRow);
    }
    table.replaceChildren(thead, tbody);
}

function rowsFor(source, extra = () => []) {
    return source.labels.map((label, index) => [label, `${source.off[index].toFixed(2)} ms`, `${source.on[index].toFixed(2)} ms`, ...extra(index)]);
}

function renderReport() {
    fillTable('entry-count-table', ['Rows', 'Off', 'On', 'Added'], rowsFor(entryCount, (index) => [`${(entryCount.on[index] - entryCount.off[index]).toFixed(2)} ms`]));
    fillTable('scan-length-table', ['Characters', 'Off', 'On', 'Extra index requests'], rowsFor(scanLength, (index) => [String(scanLength.requests[index])]));
    fillTable('definition-size-table', ['Definition size', 'Off', 'On'], rowsFor(definitionSize));
    fillTable('natural-example-table', ['Example', 'Off', 'On'], rowsFor(naturalExamples));

    if (typeof Chart === 'undefined') {
        document.getElementById('chart-status').textContent = 'Interactive plots could not load. The source tables remain available.';
        return;
    }

    Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif';
    Chart.defaults.color = colors.text;
    makeLineChart('entry-count-chart', entryCount, 'Shared-prefix records (N)');

    const added = entryCount.on.map((value, index) => value - entryCount.off[index]);
    const addedOptions = baseOptions('Shared-prefix records (N)', 'Added time (ms)');
    addedOptions.plugins.legend.display = false;
    new Chart(document.getElementById('added-time-chart'), {
        type: 'bar',
        data: {labels: entryCount.labels, datasets: [{label: 'Added time', data: added, backgroundColor: entryCount.labels.map((value) => Number(value) > 20 ? colors.orange : colors.blue), borderRadius: 5}]},
        options: addedOptions,
    });

    makeLineChart('scan-length-chart', scanLength, 'Scanned characters');
    makeLineChart('definition-size-chart', definitionSize, 'Definition characters per row');

    const naturalOptions = baseOptions('Example', 'Median lookup time (ms)');
    naturalOptions.indexAxis = 'y';
    naturalOptions.scales.x.title.text = 'Median lookup time (ms)';
    naturalOptions.scales.y.title.display = false;
    new Chart(document.getElementById('natural-example-chart'), {
        type: 'bar',
        data: {labels: naturalExamples.labels, datasets: [dataset('Feature off', naturalExamples.off, colors.blue), dataset('Feature on', naturalExamples.on, colors.orange)]},
        options: naturalOptions,
    });

    document.getElementById('chart-status').textContent = 'Interactive plots loaded with Chart.js 4.5.1.';
}

renderReport();
