// Register Chart.js plugins
Chart.register(ChartDataLabels);

// Configure default options for all charts
Chart.defaults.set({
    plugins: {
        datalabels: {
            color: '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 4,
            padding: 4,
            font: {
                family: "'Poppins', sans-serif",
                weight: 'bold',
                size: 11
            },
            formatter: (value) => {
                // Format numbers with thousand separators
                return value.toLocaleString('id-ID');
            }
        },
        legend: {
            display: true,
            position: 'top'
        }
    }
});

// Initialize charts object
const charts = {};

// Define chart configurations for each tab
const chartConfigs = {
    ppb: [
        { id: 'sbu', type: 'bar', label: 'Jumlah Stok PPB (Btg) tiap SBU', field: 'stok_ppb', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah Stok PPB (Rp) tiap SBU', field: 'saldo_ppb', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah Stok PPB (Btg) tiap PPB', field: 'stok_ppb', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah Stok PPB (Rp) tiap PPB', field: 'saldo_ppb', groupBy: 'ppb' },
        { id: 'range-umur', type: 'bar', label: 'Jumlah Stok PPB (Btg) tiap Range Umur', field: 'stok_ppb', groupBy: 'range_umur' },
        { id: 'range-umur-saldo', type: 'bar', label: 'Jumlah Stok PPB (Rp) tiap Range Umur', field: 'saldo_ppb', groupBy: 'range_umur' },
        { id: 'tahun', type: 'line', label: 'Jumlah Stok PPB (Btg) tiap Tahun', field: 'stok_ppb', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah Stok PPB (Rp) tiap Tahun', field: 'saldo_ppb', groupBy: 'tahun' }
    ],
    site: [
        { id: 'sbu', type: 'bar', label: 'Jumlah Stok Site (Btg) tiap SBU', field: 'stok_site', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah Stok Site (Rp) tiap SBU', field: 'saldo_site', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah Stok Site (Btg) tiap PPB', field: 'stok_site', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah Stok Site (Rp) tiap PPB', field: 'saldo_site', groupBy: 'ppb' },
        { id: 'range-umur', type: 'bar', label: 'Jumlah Stok Site (Btg) tiap Range Umur', field: 'stok_site', groupBy: 'range_umur' },
        { id: 'range-umur-saldo', type: 'bar', label: 'Jumlah Stok Site (Rp) tiap Range Umur', field: 'saldo_site', groupBy: 'range_umur' },
        { id: 'tahun', type: 'line', label: 'Jumlah Stok Site (Btg) tiap Tahun', field: 'stok_site', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah Stok Site (Rp) tiap Tahun', field: 'saldo_site', groupBy: 'tahun' }
    ],
    bebas: [
        { id: 'sbu', type: 'bar', label: 'Jumlah Stok Bebas (Btg) tiap SBU', field: 'stok_bebas', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah Stok Bebas (Rp) tiap SBU', field: 'saldo_bebas', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah Stok Bebas (Btg) tiap PPB', field: 'stok_bebas', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah Stok Bebas (Rp) tiap PPB', field: 'saldo_bebas', groupBy: 'ppb' },
        { id: 'range-umur', type: 'bar', label: 'Jumlah Stok Bebas (Btg) tiap Range Umur', field: 'stok_bebas', groupBy: 'range_umur' },
        { id: 'range-umur-saldo', type: 'bar', label: 'Jumlah Stok Bebas (Rp) tiap Range Umur', field: 'saldo_bebas', groupBy: 'range_umur' },
        { id: 'tahun', type: 'line', label: 'Jumlah Stok Bebas (Btg) tiap Tahun', field: 'stok_bebas', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah Stok Bebas (Rp) tiap Tahun', field: 'saldo_bebas', groupBy: 'tahun' }
    ],
    'titipan-percepatan': [
        { id: 'sbu', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Btg) tiap SBU', field: 'stok_titipan_percepatan', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Rp) tiap SBU', field: 'saldo_titipan_percepatan', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Btg) tiap PPB', field: 'stok_titipan_percepatan', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Rp) tiap PPB', field: 'saldo_titipan_percepatan', groupBy: 'ppb' },
        { id: 'range-umur', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Btg) tiap Range Umur', field: 'stok_titipan_percepatan', groupBy: 'range_umur' },
        { id: 'range-umur-saldo', type: 'bar', label: 'Jumlah Stok Titipan Percepatan (Rp) tiap Range Umur', field: 'saldo_titipan_percepatan', groupBy: 'range_umur' },
        { id: 'tahun', type: 'line', label: 'Jumlah Stok Titipan Percepatan (Btg) tiap Tahun', field: 'stok_titipan_percepatan', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah Stok Titipan Percepatan (Rp) tiap Tahun', field: 'saldo_titipan_percepatan', groupBy: 'tahun' },
        { id: 'mutasi-tahun', type: 'line', label: 'Jumlah Mutasi Stok Titipan Percepatan (Btg) tiap Tahun', field: 'mutasi_stok_titipan_percepatan', groupBy: 'tahun' },
        { id: 'mutasi-saldo-tahun', type: 'line', label: 'Jumlah Mutasi Stok Titipan Percepatan (Rp) tiap Tahun', field: 'mutasi_saldo_titipan_percepatan', groupBy: 'tahun' }
    ],
    'titipan-murni': [
        { id: 'sbu', type: 'bar', label: 'Jumlah Stok Titipan Murni (Btg) tiap SBU', field: 'stok_titipan_murni', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah Stok Titipan Murni (Rp) tiap SBU', field: 'saldo_titipan_murni', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah Stok Titipan Murni (Btg) tiap PPB', field: 'stok_titipan_murni', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah Stok Titipan Murni (Rp) tiap PPB', field: 'saldo_titipan_murni', groupBy: 'ppb' },
        { id: 'range-umur', type: 'bar', label: 'Jumlah Stok Titipan Murni (Btg) tiap Range Umur', field: 'stok_titipan_murni', groupBy: 'range_umur' },
        { id: 'range-umur-saldo', type: 'bar', label: 'Jumlah Stok Titipan Murni (Rp) tiap Range Umur', field: 'saldo_titipan_murni', groupBy: 'range_umur' },
        { id: 'tahun', type: 'line', label: 'Jumlah Stok Titipan Murni (Btg) tiap Tahun', field: 'stok_titipan_murni', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah Stok Titipan Murni (Rp) tiap Tahun', field: 'saldo_titipan_murni', groupBy: 'tahun' },
        { id: 'mutasi-tahun', type: 'line', label: 'Jumlah Mutasi Stok Titipan Murni (Btg) tiap Tahun', field: 'mutasi_stok_titipan_murni', groupBy: 'tahun' },
        { id: 'mutasi-saldo-tahun', type: 'line', label: 'Jumlah Mutasi Stok Titipan Murni (Rp) tiap Tahun', field: 'mutasi_saldo_titipan_murni', groupBy: 'tahun' }
    ]
};

// Helper function to get all possible group keys for a groupBy type
function getAllGroupKeys(groupBy) {
    switch (groupBy) {
        case 'tahun':
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let y = 2018; y <= currentYear; y++) {
                years.push(y.toString());
            }
            return years;
        case 'range_umur':
            return ['0–1 tahun', '2–3 tahun', '4–5 tahun', '6–7 tahun', '> 8 tahun'];
        case 'sbu':
            return ['BR', 'HD', 'MR', 'PI', 'PO', 'RT', 'RY'];
        case 'ppb':
            return ['BGR', 'BYL', 'MJK', 'PSR'];
        default:
            return [];
    }
}

// Helper function to create charts
function createChart(ctx, type, labels, data, label, backgroundColor = 'rgba(54, 162, 235, 0.7)') {
    if (!ctx || !ctx.canvas) {
        console.error('Invalid canvas context provided');
        return null;
    }

    const chartId = ctx.canvas.id || 'unknown-chart';
    console.log(`Creating chart: ${chartId}`);

    const config = {
        type: type,
        data: {
            labels: labels || [],
            datasets: [{
                label: label || 'Data',
                data: data || [],
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.replace('0.7', '1'),
                borderWidth: 1,
                tension: type === 'line' ? 0.4 : 0, // Add curve to lines
                fill: type === 'line' ? false : true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 4,
                    padding: 4,
                    font: {
                        family: "'Poppins', sans-serif",
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value) => value.toLocaleString('id-ID')
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: label,
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => value.toLocaleString('id-ID')
                    }
                }
            }
        }
    };

    try {
        return new Chart(ctx, config);
    } catch (error) {
        console.error(`Error creating chart ${chartId}:`, error);
        return null;
    }
}

// Initialize charts for a specific tab
async function initializeCharts(tab) {
    console.log(`📊 Initializing charts for tab: ${tab}`);
    
    if (!tab) {
        console.warn('No tab specified for chart initialization');
        return {};
    }

    try {
        // Clean up existing charts
        if (charts[tab]) {
            Object.values(charts[tab]).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        }

        charts[tab] = {};
        const configs = chartConfigs[tab];

        if (!configs) {
            console.error(`No chart configurations found for tab: ${tab}`);
            return {};
        }

        for (const config of configs) {
            const chartId = `chart-${tab}-${config.id}`;
            const canvas = document.getElementById(chartId);
            
            if (!canvas) {
                console.warn(`Canvas not found: ${chartId}`);
                continue;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error(`No 2D context for ${chartId}`);
                continue;
            }

            const chart = createChart(ctx, config.type, [], [], config.label);
            if (chart) {
                charts[tab][chartId] = chart;
                console.log(`✅ Created chart: ${chartId}`);
            }
        }

        return charts[tab];
    } catch (error) {
        console.error(`Failed to initialize charts for tab ${tab}:`, error);
        return {};
    }
}

// Update charts for a specific tab
async function updateCharts(tab, data) {
    console.log(`📊 Updating charts for tab: ${tab}`);
    
    try {
        if (!charts[tab]) {
            console.warn(`Charts not initialized for tab: ${tab}. Initializing...`);
            await initializeCharts(tab);
        }

        if (!data || !Array.isArray(data)) {
            console.warn(`Invalid data for tab: ${tab}, using empty array`);
            data = [];
        }

        // Aggregate data for charts
        const aggregatedData = {};
        const groups = ['sbu', 'ppb', 'range_umur', 'tahun'];
        
        groups.forEach(group => {
            aggregatedData[group] = {};
            getAllGroupKeys(group).forEach(key => {
                aggregatedData[group][key] = {
                    stok: 0,
                    saldo: 0,
                    mutasi_stok: 0,
                    mutasi_saldo: 0
                };
            });
        });

        // Process data
        data.forEach(item => {
            groups.forEach(group => {
                const key = item[group]?.toString() || 'Undefined';
                if (aggregatedData[group][key]) {
                    // Get all configs for this group
                    const configs = chartConfigs[tab].filter(c => c.groupBy === group);
                    
                    configs.forEach(config => {
                        const value = parseFloat(item[config.field]) || 0;
                        
                        if (config.field.includes('saldo')) {
                            aggregatedData[group][key].saldo += value;
                        } else if (config.field.includes('mutasi')) {
                            if (config.field.includes('saldo')) {
                                aggregatedData[group][key].mutasi_saldo += value;
                            } else {
                                aggregatedData[group][key].mutasi_stok += value;
                            }
                        } else {
                            aggregatedData[group][key].stok += value;
                        }
                    });
                }
            });
        });

        // Update each chart
        const configs = chartConfigs[tab] || [];
        for (const config of configs) {
            const chartId = `chart-${tab}-${config.id}`;
            const chart = charts[tab][chartId];
            
            if (!chart) {
                console.warn(`Chart not found: ${chartId}`);
                continue;
            }

            const groupData = aggregatedData[config.groupBy] || {};
            const sortedKeys = Object.keys(groupData).sort((a, b) => {
                if (config.groupBy === 'tahun') {
                    return parseInt(a) - parseInt(b);
                }
                if (config.groupBy === 'range_umur') {
                    const rangeOrder = {
                        '0–1 tahun': 1,
                        '2–3 tahun': 2,
                        '4–5 tahun': 3,
                        '6–7 tahun': 4,
                        '> 8 tahun': 5
                    };
                    return (rangeOrder[a] || 999) - (rangeOrder[b] || 999);
                }
                const aValue = config.field.includes('saldo') ? groupData[a].saldo : groupData[a].stok;
                const bValue = config.field.includes('saldo') ? groupData[b].saldo : groupData[b].stok;
                return bValue - aValue;
            });

            chart.data.labels = sortedKeys;
            chart.data.datasets[0].data = sortedKeys.map(key => {
                const value = config.field.includes('saldo') ? 
                    groupData[key].saldo : 
                    config.field.includes('mutasi_saldo') ? 
                        groupData[key].mutasi_saldo : 
                        config.field.includes('mutasi_stok') ? 
                            groupData[key].mutasi_stok : 
                            groupData[key].stok;
                return value || 0;
            });

            // Update chart without animation and force reflow
            chart.update('none');
            
            // Only resize if the canvas is still in the document
            if (chart.canvas && chart.canvas.ownerDocument && chart.canvas.ownerDocument.body.contains(chart.canvas)) {
                requestAnimationFrame(() => {
                    try {
                        chart.resize();
                    } catch (resizeError) {
                        console.warn(`Failed to resize chart ${chartId}:`, resizeError);
                    }
                });
            }
        }

        console.log(`✅ Successfully updated all charts for tab: ${tab}`);
    } catch (error) {
        console.error(`❌ Error updating charts for tab ${tab}:`, error);
        throw error;
    }
}

// Export functions
window.initializeCharts = initializeCharts;
window.updateCharts = updateCharts;
window.charts = charts;
