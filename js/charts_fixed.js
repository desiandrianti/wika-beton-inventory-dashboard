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
    distribusi: { 
        prefix: 'DISTRIBUSI', 
        stokField: 'stok_distribusi', 
        saldoField: 'saldo_distribusi', 
        mutasiStokField: 'mutasi_stok_distribusi', 
        mutasiSaldoField: 'mutasi_saldo_distribusi',
        hasMutasi: true 
    },
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
                // Add a custom plugin to show "No Data" message
                noData: {
                    id: 'noData',
                    beforeDraw(chart, args, options) {
                        const {ctx, data, chartArea: {left, top, width, height}} = chart;
                        
                        if (data.datasets[0].data.length === 0 || data.datasets[0].data.every(d => d === 0)) {
                            ctx.save();
                            
                            // Draw gradient background
                            const gradient = ctx.createLinearGradient(left, top, left, top + height);
                            gradient.addColorStop(0, 'rgba(249, 250, 251, 0.95)');
                            gradient.addColorStop(1, 'rgba(249, 250, 251, 0.85)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(left, top, width, height);
                            
                            // Store card dimensions for hover detection
                            chart._emptyStateCard = {
                                width: Math.min(300, width - 40),
                                height: 140,
                                left: left + (width - Math.min(300, width - 40)) / 2,
                                top: top + (height - 140) / 2
                            };
                            
                            const { width: cardWidth, height: cardHeight, left: cardLeft, top: cardTop } = chart._emptyStateCard;
                            
                            // Easing function for smoother animation
                            function easeOutCubic(x) {
                                return 1 - Math.pow(1 - x, 3);
                            }
                            
                            // Calculate hover progress with easing (0 to 1)
                            const now = Date.now();
                            if (!chart._hoverStartTime) chart._hoverStartTime = now;
                            const hoverDuration = 200; // 200ms transition
                            
                            let progress = 0;
                            if (chart._isHovered) {
                                progress = Math.min(1, (now - chart._hoverStartTime) / hoverDuration);
                            } else {
                                progress = Math.max(0, 1 - (now - chart._hoverStartTime) / hoverDuration);
                            }
                            
                            // Apply easing to the progress
                            const hoverProgress = easeOutCubic(progress);
                            
                            // Store the animation frame ID for cleanup
                            if (!chart._animationFrame) {
                                chart._animationFrame = null;
                            }
                            
                            // Interpolate values based on hover progress
                            const shadowBlur = 10 + (6 * hoverProgress);
                            const shadowOffsetY = 4 + (2 * hoverProgress);
                            const borderWidth = 1 + hoverProgress;
                            
                            // Calculate background color interpolation
                            const bgR = Math.round(255 + (248 - 255) * hoverProgress);
                            const bgG = Math.round(255 + (250 - 255) * hoverProgress);
                            const bgB = Math.round(255 + (255 - 255) * hoverProgress);
                            
                            // Draw card shadow with smooth transition
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                            ctx.shadowBlur = shadowBlur;
                            ctx.shadowOffsetY = shadowOffsetY;
                            
                            // Draw card background with smooth color transition
                            ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
                            ctx.beginPath();
                            ctx.roundRect(cardLeft, cardTop, cardWidth, cardHeight, 12);
                            ctx.fill();
                            
                            // Reset shadow
                            ctx.shadowColor = 'transparent';
                            ctx.shadowBlur = 0;
                            ctx.shadowOffsetY = 0;
                            
                            // Calculate border color interpolation
                            const borderR = Math.round(229 + (59 - 229) * hoverProgress);
                            const borderG = Math.round(231 + (130 - 231) * hoverProgress);
                            const borderB = Math.round(235 + (246 - 235) * hoverProgress);
                            
                            // Draw card border with smooth color transition
                            ctx.strokeStyle = `rgb(${borderR}, ${borderG}, ${borderB})`;
                            ctx.lineWidth = borderWidth;
                            ctx.beginPath();
                            ctx.roundRect(cardLeft, cardTop, cardWidth, cardHeight, 12);
                            ctx.stroke();
                            
                            // Add mousemove and mouseleave listeners for hover effect if not already added
                            if (!chart._hasHoverListener) {
                                const handleMouseMove = function(evt) {
                                    const rect = chart.canvas.getBoundingClientRect();
                                    const x = evt.clientX - rect.left;
                                    const y = evt.clientY - rect.top;
                                    
                                    const card = chart._emptyStateCard;
                                    const wasHovered = chart._isHovered;
                                    chart._isHovered = (
                                        x >= card.left && x <= card.left + card.width &&
                                        y >= card.top && y <= card.top + card.height
                                    );
                                    
                                    if (wasHovered !== chart._isHovered) {
                                        chart._hoverStartTime = Date.now();
                                        // Cancel any existing animation
                                        if (chart._animationFrame) {
                                            cancelAnimationFrame(chart._animationFrame);
                                        }
                                        
                                        // Start new animation
                                        function animate() {
                                            chart.draw();
                                            if (chart._isHovered && progress < 1 || !chart._isHovered && progress > 0) {
                                                chart._animationFrame = requestAnimationFrame(animate);
                                            } else {
                                                chart._animationFrame = null;
                                            }
                                        }
                                        chart._animationFrame = requestAnimationFrame(animate);
                                    }
                                };
                                
                                const handleMouseLeave = function() {
                                    if (chart._isHovered) {
                                        chart._isHovered = false;
                                        chart._hoverStartTime = Date.now();
                                        
                                        // Cancel any existing animation
                                        if (chart._animationFrame) {
                                            cancelAnimationFrame(chart._animationFrame);
                                        }
                                        
                                        // Start new animation
                                        function animate() {
                                            chart.draw();
                                            if (progress > 0) {
                                                chart._animationFrame = requestAnimationFrame(animate);
                                            } else {
                                                chart._animationFrame = null;
                                            }
                                        }
                                        chart._animationFrame = requestAnimationFrame(animate);
                                    }
                                };
                                
                                // Clean up animation frame on chart destroy
                                const originalDestroy = chart.destroy;
                                chart.destroy = function() {
                                    if (chart._animationFrame) {
                                        cancelAnimationFrame(chart._animationFrame);
                                    }
                                    originalDestroy.call(chart);
                                };
                                
                                chart.canvas.addEventListener('mousemove', handleMouseMove);
                                chart.canvas.addEventListener('mouseleave', handleMouseLeave);
                                chart._hasHoverListener = true;
                            }
                            
                            // Draw upload icon with blue background
                            const iconSize = 40;
                            const iconLeft = cardLeft + (cardWidth - iconSize) / 2;
                            const iconTop = cardTop + 20;
                            
                            ctx.fillStyle = '#EBF5FF';
                            ctx.beginPath();
                            ctx.arc(iconLeft + iconSize/2, iconTop + iconSize/2, iconSize/2, 0, Math.PI * 2);
                            ctx.fill();
                            
                            ctx.font = '24px Poppins';
                            ctx.fillStyle = '#3B82F6';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('⬆️', iconLeft + iconSize/2, iconTop + iconSize/2);
                            
                            // Draw "No Data" message
                            ctx.font = 'bold 16px Poppins';
                            ctx.fillStyle = '#374151';
                            ctx.fillText('Belum ada data tersedia', cardLeft + cardWidth/2, cardTop + 80);
                            
                            // Draw helper text with underline
                            const helperText = 'Silakan upload file Excel untuk melihat grafik';
                            ctx.font = '13px Poppins';
                            ctx.fillStyle = '#3B82F6';
                            ctx.fillText(helperText, cardLeft + cardWidth/2, cardTop + 105);
                            
                            // Add underline to text
                            const textWidth = ctx.measureText(helperText).width;
                            ctx.beginPath();
                            ctx.moveTo(cardLeft + cardWidth/2 - textWidth/2, cardTop + 108);
                            ctx.lineTo(cardLeft + cardWidth/2 + textWidth/2, cardTop + 108);
                            ctx.strokeStyle = '#3B82F6';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            
                            ctx.restore();
                            
                            // Add click handler for the empty state message
                            chart.canvas.onclick = function(evt) {
                                const rect = chart.canvas.getBoundingClientRect();
                                const x = evt.clientX - rect.left;
                                const y = evt.clientY - rect.top;
                                
                                // Check if click is within the card area
                                if (x >= cardLeft && x <= cardLeft + cardWidth &&
                                    y >= cardTop && y <= cardTop + cardHeight) {
                                    // Navigate to Upload Data section
                                    document.querySelector('[data-target="upload-section"]').click();
                                }
                            };
                            
                            // Change cursor to pointer when hovering over the card
                            chart.canvas.style.cursor = 'pointer';
                        } else {
                            // Reset cursor and click handler when there is data
                            chart.canvas.style.cursor = 'default';
                            chart.canvas.onclick = null;
                        }
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

    // Helper function to get all possible group keys for a groupBy type
    function getAllGroupKeys(groupBy) {
        switch (groupBy) {
            case 'tahun':
                // Assuming years from 2018 to current year 
                const currentYear = new Date().getFullYear();
                const years = [];
                for (let y = 2018; y <= currentYear; y++) {
                    years.push(y.toString());
                }
                return years;
            case 'range_umur':
                return ['0-1 tahun', '2-3 tahun', '4-5 tahun', '6-7 tahun', '> 8 tahun'];
            case 'sbu':
                // Example SBU list - should be replaced with actual SBU list if available
                return ['BR', 'HD', 'MR', 'PI', 'PO', 'RT', 'RY'];
            case 'ppb':
                // Example PPB list - should be replaced with actual PPB list if available
                return ['BGR', 'BYL', 'MJK', 'PSR'];
            case 'area':
                // Example AREA list
                return ['JABAR', 'JATENG', 'JATIM', 'BALI', 'NTT', 'NTB'];
            default:
                return [];
        }
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

            // Get all possible group keys for this groupBy
            const allGroupKeys = getAllGroupKeys(config.groupBy);

            // Fill missing group keys with zero values
            allGroupKeys.forEach(key => {
                if (!(key in aggregateData)) {
                    aggregateData[key] = 0;
                }
            });

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
