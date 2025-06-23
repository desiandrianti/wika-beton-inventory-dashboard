// Register the datalabels plugin
if (window.Chart && window.ChartDataLabels) {
    Chart.register(ChartDataLabels);
}

// charts.js - basic chart initialization and update functions for dashboard
const charts = {};

// Define chart configurations for each tab
const chartConfigs = {
    ok: [
        { id: 'sbu', type: 'bar', label: 'Jumlah STOK OK berdasarkan SBU', field: 'stok_ok', groupBy: 'sbu' },
        { id: 'sbu-saldo', type: 'bar', label: 'Jumlah SALDO OK berdasarkan SBU', field: 'saldo_ok', groupBy: 'sbu' },
        { id: 'ppb', type: 'bar', label: 'Jumlah STOK OK berdasarkan PPB', field: 'stok_ok', groupBy: 'ppb' },
        { id: 'ppb-saldo', type: 'bar', label: 'Jumlah SALDO OK berdasarkan PPB', field: 'saldo_ok', groupBy: 'ppb' },
        { id: 'tahun', type: 'line', label: 'Jumlah STOK OK tiap TAHUN', field: 'stok_ok', groupBy: 'tahun' },
        { id: 'tahun-saldo', type: 'line', label: 'Jumlah SALDO OK tiap TAHUN', field: 'saldo_ok', groupBy: 'tahun' }
    ]
};

// Add configurations for remaining tabs
// Add mutasi fields for distribusi, titipan-percepatan, titipan-murni
const remainingTabs = {
    spprb: { prefix: 'SPPRB', stokField: 'stok_spprb', saldoField: 'saldo_spprb' },
    produksi: { prefix: 'PRODUKSI', stokField: 'stok_produksi_saat_ini', saldoField: null },
    distribusi: { prefix: 'DISTRIBUSI', stokField: 'stok_distribusi', saldoField: 'saldo_distribusi', mutasiStokField: 'mutasi_stok_distribusi', mutasiSaldoField: 'mutasi_saldo_distribusi' },
    lancar: { prefix: 'LANCAR', stokField: 'stok_lancar', saldoField: 'saldo_lancar' },
    bebas: { prefix: 'BEBAS', stokField: 'stok_bebas', saldoField: 'saldo_bebas', hasRangeUmur: true },
    'titipan-percepatan': { 
        prefix: 'TITIPAN PERCEPATAN', 
        stokField: 'stok_titipan_percepatan', 
        saldoField: 'saldo_titipan_percepatan',
        mutasiStokField: 'mutasi_stok_titipan_percepatan',
        mutasiSaldoField: 'mutasi_saldo_titipan_percepatan',
        hasRangeUmur: true,
        hasMutasi: true
    },
    'titipan-murni': { 
        prefix: 'TITIPAN MURNI', 
        stokField: 'stok_titipan_murni', 
        saldoField: 'saldo_titipan_murni',
        mutasiStokField: 'mutasi_stok_titipan_murni',
        mutasiSaldoField: 'mutasi_saldo_titipan_murni',
        hasRangeUmur: true,
        hasMutasi: true
    },
    op: { prefix: 'OP', stokField: 'stok_op', saldoField: 'saldo_op' },
    ppb: { prefix: 'PPB', stokField: 'stok_ppb', saldoField: 'saldo_ppb', hasRangeUmur: true },
    site: { prefix: 'SITE', stokField: 'stok_site', saldoField: 'saldo_site', hasRangeUmur: true }
};

// Generate chart configurations for remaining tabs
Object.entries(remainingTabs).forEach(([key, config]) => {
    const configs = [];
    
    if (config.stokField) {
        configs.push(
            { id: 'sbu', type: 'bar', label: `Jumlah STOK ${config.prefix} berdasarkan SBU`, field: config.stokField, groupBy: 'sbu' },
            { id: 'ppb', type: 'bar', label: `Jumlah STOK ${config.prefix} berdasarkan PPB`, field: config.stokField, groupBy: 'ppb' }
        );
        
        if (key === 'produksi') {
            configs.push(
                { id: 'area', type: 'bar', label: 'Jumlah STOK PRODUKSI berdasarkan AREA', field: 'stok_produksi_saat_ini', groupBy: 'area' },
                { id: 'proporsi', type: 'pie', label: 'Proporsi STOK PRODUKSI', fields: ['stok_produksi_lalu', 'stok_produksi_saat_ini'] }
            );
        }
    }
    
    if (config.saldoField) {
        configs.push(
            { id: 'sbu-saldo', type: 'bar', label: `Jumlah SALDO ${config.prefix} berdasarkan SBU`, field: config.saldoField, groupBy: 'sbu' },
            { id: 'ppb-saldo', type: 'bar', label: `Jumlah SALDO ${config.prefix} berdasarkan PPB`, field: config.saldoField, groupBy: 'ppb' }
        );
    }
    
    if (config.hasRangeUmur) {
        configs.push(
            { id: 'range-umur', type: 'bar', label: `Jumlah STOK ${config.prefix} berdasarkan RANGE UMUR`, field: config.stokField, groupBy: 'range_umur' }
        );
        if (config.saldoField) {
            configs.push(
                { id: 'range-umur-saldo', type: 'bar', label: `Jumlah SALDO ${config.prefix} berdasarkan RANGE UMUR`, field: config.saldoField, groupBy: 'range_umur' }
            );
        }
    }
    
    configs.push(
        { id: 'tahun', type: 'line', label: `Jumlah STOK ${config.prefix} tiap TAHUN`, field: config.stokField, groupBy: 'tahun' }
    );
    
    if (config.saldoField) {
        configs.push(
            { id: 'tahun-saldo', type: 'line', label: `Jumlah SALDO ${config.prefix} tiap TAHUN`, field: config.saldoField, groupBy: 'tahun' }
        );
    }

    // Add mutasi charts if available
    if (config.hasMutasi && config.mutasiStokField && config.mutasiSaldoField) {
        configs.push(
            { id: 'mutasi-tahun', type: 'line', label: `Jumlah MUTASI STOK ${config.prefix} tiap TAHUN`, field: config.mutasiStokField, groupBy: 'tahun' },
            { id: 'mutasi-saldo-tahun', type: 'line', label: `Jumlah MUTASI SALDO ${config.prefix} tiap TAHUN`, field: config.mutasiSaldoField, groupBy: 'tahun' }
        );
    }
    
    chartConfigs[key] = configs;
});

// Helper function to create charts
function createChart(ctx, type, labels, data, label, backgroundColor) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const value = context.parsed.y ?? context.parsed;
                        if (value === null || value === undefined) {
                            label += 'Data tidak tersedia';
                        } else if (label.toLowerCase().includes('saldo')) {
                            label += new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(value);
                        } else {
                            label += value.toLocaleString('id-ID');
                        }
                        return label;
                    }
                }
            },
            legend: {
                display: type === 'pie',
                position: 'right'
            },
            title: {
                display: true,
                text: label,
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            datalabels: {
                display: function(context) {
                    // Always display label even if value is zero
                    return context.dataset.data[context.dataIndex] !== null;
                },
                color: '#000',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 4,
                padding: 4,
                anchor: type === 'pie' ? 'center' : 'end',
                align: type === 'pie' ? 'center' : 'end',
                offset: type === 'pie' ? 0 : 8,
                formatter: function(value) {
                    if (this.chart.options.plugins.title.text.toLowerCase().includes('saldo')) {
                        return new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            notation: 'compact',
                            compactDisplay: 'short',
                            maximumFractionDigits: 1
                        }).format(value);
                    }
                    return value.toLocaleString('id-ID');
                },
                font: {
                    weight: 'bold',
                    size: 11
                }
            }
        },
        elements: {
            point: {
                radius: 4,
                hoverRadius: 6,
                hitRadius: 6,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                // Show points even if value is zero
                skipNull: false,
                // Always show points
                radius: 4
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        if (label.toLowerCase().includes('saldo')) {
                            return new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                notation: 'compact',
                                compactDisplay: 'short'
                            }).format(value);
                        }
                        return value.toLocaleString('id-ID');
                    }
                }
            }
        }
    };

    const config = {
        type: type,
        data: {
            labels: labels || [],
            datasets: [{
                label: label || 'Data',
                data: data || [],
                backgroundColor: Array.isArray(backgroundColor) ? backgroundColor : 
                    type === 'pie' ? [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ] : backgroundColor || 'rgba(54, 162, 235, 0.7)',
                borderColor: Array.isArray(backgroundColor) ? backgroundColor.map(color => color.replace('0.7', '1')) :
                    backgroundColor ? backgroundColor.replace('0.7', '1') : 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: baseOptions
    };

    return new Chart(ctx, config);
}

// Initialize charts for a specific tab
function initializeCharts(tab) {
    console.log(`📊 initializeCharts() dipanggil untuk tab: ${tab}`);
    
    if (!tab) {
        console.warn('No tab specified for chart initialization');
        return;
    }

    if (!charts[tab]) {
        charts[tab] = {};
    }

    const configs = chartConfigs[tab] || [];
    configs.forEach(config => {
        const chartId = `chart-${tab}-${config.id}`;
        const ctx = document.getElementById(chartId);
        if (ctx && !charts[tab][chartId]) {
            charts[tab][chartId] = createChart(
                ctx,
                config.type,
                [],
                [],
                config.label,
                'rgba(54, 162, 235, 0.7)'
            );
            console.log(`Created chart: ${chartId}`);
        }
    });
}

// Initialize default charts for all tabs
function initializeDefaultCharts() {
    const tabs = Object.keys(chartConfigs);
    tabs.forEach(tab => {
        initializeCharts(tab);
    });
}

// Update charts with new data
function updateCharts(tab, data) {
    console.log(`📊 updateCharts() called for tab: ${tab}`);

    if (!charts[tab]) {
        console.warn(`⚠️ No charts initialized for tab: ${tab}`);
        return;
    }

    if (!data || !Array.isArray(data)) {
        console.warn(`⚠️ Invalid data format for tab: ${tab}, using empty array`);
        data = [];
    }

    Object.keys(charts[tab]).forEach(chartId => {
        const chart = charts[tab][chartId];
        const config = chartConfigs[tab]?.find(c => `chart-${tab}-${c.id}` === chartId);
        
        if (!config) return;

        let labels = [];
        let values = [];

        if (config.id === 'proporsi' && tab === 'produksi' && config.fields) {
            labels = ['STOK PRODUKSI LALU', 'STOK PRODUKSI SAAT INI'];
            values = config.fields.map(field => 
                data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
            );
        } else if (config.field && config.groupBy) {
            const aggregateData = data.reduce((acc, item) => {
                const groupKey = item[config.groupBy]?.toString() || 'Undefined';
                acc[groupKey] = (acc[groupKey] || 0) + (parseFloat(item[config.field]) || 0);
                return acc;
            }, {});

            const sortedEntries = Object.entries(aggregateData).sort((a, b) => {
                if (config.groupBy === 'tahun') {
                    return parseInt(a[0]) - parseInt(b[0]);
                }
                if (config.groupBy === 'range_umur') {
                    const rangeOrder = {
                        '0-1 tahun': 1,
                        '2-3 tahun': 2,
                        '4-5 tahun': 3,
                        '6-7 tahun': 4,
                        '> 8 tahun': 5
                    };
                    return (rangeOrder[a[0]] || 999) - (rangeOrder[b[0]] || 999);
                }
                return b[1] - a[1];
            });

            labels = sortedEntries.map(([key]) => key);
            values = sortedEntries.map(([_, value]) => value);
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = values;

        // Check if all values are zero
        const allZero = values.every(v => v === 0);

        if (allZero) {
            // Set y-axis min and max to show zero line clearly
            if (chart.options.scales && chart.options.scales.y) {
                chart.options.scales.y.min = 0;
                chart.options.scales.y.max = 1;
            }
        } else {
            // Reset y-axis min and max if previously set
            if (chart.options.scales && chart.options.scales.y) {
                delete chart.options.scales.y.min;
                delete chart.options.scales.y.max;
            }
        }

        chart.update();

        // Force update datalabels plugin to show labels for zero values
        if (chart._plugins && chart._plugins._cache) {
            Object.values(chart._plugins._cache).forEach(plugin => {
                if (plugin.id === 'datalabels') {
                    plugin._draw(chart);
                }
            });
        }
    });
}

window.initializeCharts = initializeCharts;
window.initializeDefaultCharts = initializeDefaultCharts;
window.updateCharts = updateCharts;
