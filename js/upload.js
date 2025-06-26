// Global objects for storing data
window.processedStockDataByTab = window.processedStockDataByTab || {};
window.currentWorkbook = null; // Store current workbook globally

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('excelFile');
    const previewSection = document.getElementById('preview-section');
    const uploadContainer = document.querySelector('.upload-container');
    const dropZone = uploadContainer.querySelector('.cursor-pointer');

    if (!uploadContainer || !dropZone) {
        console.error('Upload elements not found! Check HTML structure and selectors.');
        return;
    }

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator hidden';
    loadingIndicator.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="ml-3 text-gray-600">Processing file...</p>
        </div>
    `;
    uploadContainer.appendChild(loadingIndicator);

    // Setup event listeners
    setupFileUpload(fileInput, dropZone);
});

function setupFileUpload(fileInput, dropZone) {
    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length) {
            handleFileUpload(event.target.files[0]);
        }
    });

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFileUpload(files[0]);
        }
    });

    // Add click handler to the drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
}

async function handleFileUpload(file) {
    if (!validateFile(file)) {
        showError('Please upload a valid Excel file (.xlsx, .xls, or .xlsm)');
        return;
    }

    showLoading(true);
    
    // Clear previous preview
    const previewSection = document.getElementById('preview-section');
    if (previewSection) {
        previewSection.innerHTML = '';
        previewSection.classList.add('hidden');
    }

    try {
        const data = await file.arrayBuffer();
        // Store workbook globally
        window.currentWorkbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
        });

        // Show preview first, let user analyze data manually
        const previewData = XLSX.utils.sheet_to_json(window.currentWorkbook.Sheets['STOK UTAMA'], { header: 1 });
        showDataPreview(previewData);

        showSuccess('File loaded successfully. Click Analyze Data to process.');
    } catch (error) {
        console.error('Error processing file:', error);
        showError(`Error processing file: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function processStockData(workbook) {
    console.log('🔄 Processing stock data...');
    
    try {
        const sheetStructure = {
            'STOK UTAMA': {
                tabs: ['ppb', 'site'],
                columns: [
                    'NPP', 'TAHUN', 'KATEGORI', 'WP', 'PPB', 'SBU', 'AREA', 'PELANGGAN', 'PROYEK', 
                    'TYPE', 'HARSAT', 'OK AWAL', 'OK ADD', 'PRODUKSI LALU', 'PRODUKSI SAAT INI', 
                    'PRODUKSI SD SAAT INI', 'MUTASI PRODUKSI', 'DISTRIBUSI LALU', 'DISTRIBUSI SAAT INI', 
                    'DISTRIBUSI SD SAAT INI', 'MUTASI DISTRIBUSI', 'OP', 'STOK PPB (BTG)', 'STOK PPB (RP)', 
                    'STOK SITE (BTG)', 'STOK SITE (RP)', 'RIJECT', 'UMUR STOK', 'RANGE UMUR', 'KETERANGAN'
                ]
            },
            'STOK KHUSUS': {
                tabs: ['bebas', 'titipan-percepatan', 'titipan-murni'],
                columns: [
                    'NPP', 'TAHUN', 'KATEGORI', 'WP', 'PPB', 'SBU', 'AREA', 'PELANGGAN', 'PROYEK', 
                    'TYPE', 'HARSAT', 'STOK BEBAS (BTG)', 'STOK BEBAS (RP)', 'STOK TITIPAN MURNI (BTG)', 
                    'STOK TITIPAN MURNI (RP)', 'STOK TITIPAN PERCEPATAN (BTG)', 'STOK TITIPAN PERCEPATAN (RP)', 
                    'RIJECT', 'UMUR STOK', 'RANGE UMUR', 'KETERANGAN'
                ]
            }
        };

        // Validate required sheets
        const requiredSheets = Object.keys(sheetStructure);
        const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
        
        if (missingSheets.length > 0) {
            throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
        }

        const processedDataByTab = {};

        // Process each sheet
        for (const [sheetName, config] of Object.entries(sheetStructure)) {
            console.log(`📑 Processing sheet: ${sheetName}`);
            
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (!jsonData || jsonData.length < 2) {
                throw new Error(`Sheet "${sheetName}" appears to be empty or invalid`);
            }

            const headers = jsonData[0].map(h => h?.toString().trim().toUpperCase());
            const missingColumns = config.columns.filter(col => !headers.includes(col));

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns in sheet "${sheetName}": ${missingColumns.join(', ')}`);
            }

            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

            // Process each tab
            for (const tab of config.tabs) {
                console.log(`🔄 Processing data for tab: ${tab}`);
                const processedRows = rows.map((row, index) => {
                    try {
                        return processRow(row, headers, tab);
                    } catch (error) {
                        console.error(`Error processing row ${index} for tab ${tab}:`, error);
                        return null;
                    }
                }).filter(row => row !== null);

                processedDataByTab[tab] = processedRows;
                
                // Store in localStorage
                try {
                    localStorage.setItem(`wika-data-${tab}`, JSON.stringify(processedRows));
                    console.log(`💾 Stored data for ${tab}`);
                } catch (error) {
                    console.warn(`Failed to store data for ${tab}:`, error);
                }
            }
        }

        // Store in global object
        window.processedStockDataByTab = processedDataByTab;

        // Initialize charts
        if (typeof window.initializeCharts === 'function') {
            await window.initializeCharts('ppb');
            if (typeof window.updateCharts === 'function') {
                await window.updateCharts('ppb', processedDataByTab['ppb'] || []);
            }
        }

        return processedDataByTab;
    } catch (error) {
        console.error('Error processing stock data:', error);
        showError('Terjadi kesalahan saat memproses data');
        throw error;
    }
}

function processRow(row, headers, tab) {
    const baseItem = {
        npp: getCellValue(row, headers, 'NPP'),
        tahun: parseInt(getCellValue(row, headers, 'TAHUN')) || 0,
        kategori: getCellValue(row, headers, 'KATEGORI'),
        wp: getCellValue(row, headers, 'WP'),
        ppb: getCellValue(row, headers, 'PPB'),
        sbu: getCellValue(row, headers, 'SBU'),
        area: getCellValue(row, headers, 'AREA'),
        pelanggan: getCellValue(row, headers, 'PELANGGAN'),
        proyek: getCellValue(row, headers, 'PROYEK'),
        type: getCellValue(row, headers, 'TYPE'),
        harsat: parseFloat(getCellValue(row, headers, 'HARSAT')) || 0,
        umur_stok: parseInt(getCellValue(row, headers, 'UMUR STOK')) || 0,
        range_umur: getCellValue(row, headers, 'RANGE UMUR'),
        riject: parseFloat(getCellValue(row, headers, 'RIJECT')) || 0
    };

    // Add tab-specific fields
    switch (tab) {
        case 'ppb':
            return {
                ...baseItem,
                stok_ppb: parseFloat(getCellValue(row, headers, 'STOK PPB (BTG)')) || 0,
                saldo_ppb: parseFloat(getCellValue(row, headers, 'STOK PPB (RP)')) || 0
            };
        case 'site':
            return {
                ...baseItem,
                stok_site: parseFloat(getCellValue(row, headers, 'STOK SITE (BTG)')) || 0,
                saldo_site: parseFloat(getCellValue(row, headers, 'STOK SITE (RP)')) || 0
            };
        case 'bebas':
            return {
                ...baseItem,
                stok_bebas: parseFloat(getCellValue(row, headers, 'STOK BEBAS (BTG)')) || 0,
                saldo_bebas: parseFloat(getCellValue(row, headers, 'STOK BEBAS (RP)')) || 0
            };
        case 'titipan-percepatan':
            return {
                ...baseItem,
                stok_titipan_percepatan: parseFloat(getCellValue(row, headers, 'STOK TITIPAN PERCEPATAN (BTG)')) || 0,
                saldo_titipan_percepatan: parseFloat(getCellValue(row, headers, 'STOK TITIPAN PERCEPATAN (RP)')) || 0
            };
        case 'titipan-murni':
            return {
                ...baseItem,
                stok_titipan_murni: parseFloat(getCellValue(row, headers, 'STOK TITIPAN MURNI (BTG)')) || 0,
                saldo_titipan_murni: parseFloat(getCellValue(row, headers, 'STOK TITIPAN MURNI (RP)')) || 0
            };
        default:
            return baseItem;
    }
}

function getCellValue(row, headers, columnName) {
    const index = headers.indexOf(columnName);
    return index >= 0 ? (row[index] || '') : '';
}

function validateFile(file) {
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    const validExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => fileName.endsWith(ext));
}

function showDataPreview(data) {
    const previewSection = document.getElementById('preview-section');
    if (!previewSection) return;

    if (!data || !Array.isArray(data) || data.length < 2) {
        console.error('Invalid preview data');
        return;
    }

    const headers = data[0];
    const rows = data.slice(1, 11); // Show first 10 rows

    const tableHTML = `
        <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        ${headers.map(h => `
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ${h}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${cell || ''}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <p class="mt-4 text-sm text-gray-500 text-center">
            Showing ${rows.length} of ${data.length - 1} rows
        </p>
    `;

    previewSection.innerHTML = `
        <h3 class="text-lg font-medium text-gray-900 mb-4">Data Preview (STOK UTAMA)</h3>
        ${tableHTML}
        <div class="mt-6 flex justify-center">
            <button id="analyzeButton" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2">
                <span>Analyze Data</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    `;

    previewSection.classList.remove('hidden');

    // Add click handler for analyze button
    const analyzeButton = document.getElementById('analyzeButton');
    if (analyzeButton) {
        // Remove any existing click handlers
        const newButton = analyzeButton.cloneNode(true);
        analyzeButton.parentNode.replaceChild(newButton, analyzeButton);
        
        newButton.addEventListener('click', async () => {
            try {
                newButton.disabled = true;
                newButton.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                    </div>
                `;

                // Process the workbook data using global workbook
                if (!window.currentWorkbook) {
                    throw new Error('No workbook data found. Please upload the file again.');
                }
                // Process and store the data
                const processedData = await processStockData(window.currentWorkbook);
                
                showSuccess('Data analyzed successfully!');
                
                // Initialize and update charts for all tabs
                const tabs = ['ppb', 'site', 'bebas', 'titipan-percepatan', 'titipan-murni'];
                for (const tab of tabs) {
                    if (typeof window.initializeCharts === 'function') {
                        await window.initializeCharts(tab);
                        if (typeof window.updateCharts === 'function') {
                            await window.updateCharts(tab, processedData[tab] || []);
                        }
                    }
                }

                // Switch to inventory section and PPB tab
                const inventoryButton = document.querySelector('button[data-target="inventory-section"]');
                const ppbTab = document.querySelector('.tab[data-tab="ppb"]');
                
                if (inventoryButton) inventoryButton.click();
                if (ppbTab) ppbTab.click();
            } catch (error) {
                console.error('Error analyzing data:', error);
                showError('Error analyzing data: ' + error.message);
            } finally {
                newButton.disabled = false;
                newButton.innerHTML = `
                    <span>Analyze Data</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                `;
            }
        });
    }
}

function showLoading(show) {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.toggle('hidden', !show);
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
