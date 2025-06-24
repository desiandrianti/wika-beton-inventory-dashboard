// File: upload.js

// Global object for storing processed data
window.processedStockDataByTab = window.processedStockDataByTab || {};

document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('excelFile');
    const previewSection = document.getElementById('preview-section');
    const previewTable = document.getElementById('preview-table');
    const uploadContainer = document.querySelector('.upload-container');
    const dropZone = uploadContainer.querySelector('.cursor-pointer');

    if (!uploadContainer || !dropZone) {
        console.error('Upload elements not found! Check HTML structure and selectors.');
        return;
    }

    let currentData = null;

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

    // Add click handler to the drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Show welcome message when upload section is shown
    const uploadSection = document.getElementById('upload-section');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!uploadSection.classList.contains('hidden')) {
                    showNotification('Silakan upload file Excel sesuai format. Pastikan semua kolom wajib terisi dengan benar.', 'success');
                }
            }
        });
    });

    observer.observe(uploadSection, {
        attributes: true
    });

    // Drag and Drop handlers
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
            fileInput.files = files;
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Process Excel file
    function handleFileUpload(file) {
        // Validate file type
        if (!validateFile(file)) {
            showError('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }

        // Show loading indicator
        showLoading(true);
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                // Parse Excel file
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // Validate data structure
                if (!jsonData || jsonData.length < 2) {
                    throw new Error('File appears to be empty or invalid');
                }

                const headers = jsonData[0];
                const requiredColumns = [
                    'NPP', 'TAHUN', 'KATEGORI', 'WP', 'PPB', 'SBU', 'AREA', 
                    'PELANGGAN', 'PROYEK', 'TYPE', 'HARSAT', 'UMUR STOK', 'RANGE UMUR', 'KETERANGAN'
                ];

                // Validate required columns
                const missingColumns = requiredColumns.filter(col => 
                    !headers.some(h => h.toString().toUpperCase() === col)
                );

                if (missingColumns.length > 0) {
                    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
                }

                // Process and preview data
                processAndPreviewData(jsonData);
                showSuccess('File processed successfully!');

            } catch (error) {
                console.error('Error processing file:', error);
                showError(`Error processing file: ${error.message}`);
            } finally {
                showLoading(false);
            }
        };

        reader.onerror = function () {
            console.error('Error reading file');
            showError('Error reading file. Please try again.');
            showLoading(false);
        };

        reader.readAsArrayBuffer(file);
    }

    // Validate file type
    function validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream' // For .xlsx files in some browsers
        ];
        const fileName = file.name.toLowerCase();
        return validTypes.includes(file.type) || 
               fileName.endsWith('.xlsx') || 
               fileName.endsWith('.xls');
    }

    // Process and display data preview
    function processAndPreviewData(jsonData) {
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        currentData = { headers, rows };

        // Create HTML table
        let tableHTML = '<div style="overflow-x:auto; border:1px solid #ccc; border-radius:6px; max-width:1000px; margin:auto;">';
        tableHTML += '<table style="border-collapse:collapse; width:100%; min-width:1000px; font-size: 13px;">';
        
        // Headers
        tableHTML += '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th style="border:1px solid #ccc; padding:4px; white-space:nowrap;">${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Preview rows (first 10)
        const previewRows = rows.slice(0, 10);
        previewRows.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach((_, index) => {
                tableHTML += `<td style="border:1px solid #ccc; padding:4px; white-space:nowrap;">${row[index] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table></div>';

        // Update preview section
        previewSection.innerHTML = `
            <h2 class="text-lg font-semibold mb-4 text-center">Data Preview</h2>
            ${tableHTML}
            <div class="mt-6 flex justify-center">
                <button id="analyzeButton" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
                    Analyze Data
                </button>
            </div>
            <p class="text-sm text-gray-600 mt-2 text-center">Showing ${previewRows.length} of ${rows.length} rows</p>
        `;

        // Bind analyze button
        const analyzeButton = document.getElementById('analyzeButton');
        if (analyzeButton) {
            analyzeButton.addEventListener('click', () => {
                if (currentData) {
                    analyzeButton.disabled = true;
                    analyzeButton.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span>Analyzing...';

                    try {
                        processStockData(currentData.headers, currentData.rows);
                        showSuccess('Data analyzed successfully!');
                        document.querySelector('button[data-target="inventory-section"]').click();
                        document.querySelector('.tab[data-tab="ok"]').click();
                    } catch (error) {
                        showError('Error analyzing data: ' + error.message);
                    } finally {
                        analyzeButton.disabled = false;
                        analyzeButton.textContent = 'Analyze Data';
                    }
                }
            });
        }

        previewSection.classList.remove('hidden');
    }

    // Process stock data and update charts
    function processStockData(headers, rows) {
        const headerMap = createHeaderMap(headers);
        const data = rows.map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                const key = headerMap[header] || header;
                // Convert numeric values
                if (!isNaN(row[i])) {
                    obj[key] = parseFloat(row[i]) || 0;
                } else {
                    obj[key] = row[i];
                }
            });
            return obj;
        });

        // Validate and standardize data
        const processedData = data.map(item => ({
            // Common fields
            npp: item.npp?.toString() || '',
            tahun: parseInt(item.tahun) || 0,
            kategori: item.kategori?.toString().toUpperCase() || '',
            wp: item.wp?.toString().toUpperCase() || '',
            ppb: item.ppb?.toString().toUpperCase() || '',
            sbu: item.sbu?.toString().toUpperCase() || '',
            area: item.area?.toString().toUpperCase() || '',
            pelanggan: item.pelanggan?.toString() || '',
            proyek: item.proyek?.toString() || '',
            type: item.type?.toString() || '',
            harsat: parseFloat(item.harsat) || 0,
            umur_stok: parseInt(item.umur_stok) || 0,
            range_umur: item.range_umur?.toString() || '',
            keterangan: item.keterangan?.toString() || '',

            // Specific fields with numeric validation
            stok_ok: parseFloat(item.stok_ok) || 0,
            saldo_ok: parseFloat(item.saldo_ok) || 0,
            
            stok_spprb: parseFloat(item.stok_spprb) || 0,
            saldo_spprb: parseFloat(item.saldo_spprb) || 0,
            
            stok_produksi_lalu: parseFloat(item.stok_produksi_lalu) || 0,
            stok_produksi_saat_ini: parseFloat(item.stok_produksi_saat_ini) || 0,
            
            stok_distribusi: parseFloat(item.stok_distribusi) || 0,
            saldo_distribusi: parseFloat(item.saldo_distribusi) || 0,
            mutasi_stok_distribusi: parseFloat(item.mutasi_stok_distribusi) || 0,
            mutasi_saldo_distribusi: parseFloat(item.mutasi_saldo_distribusi) || 0,
            
            stok_lancar: parseFloat(item.stok_lancar) || 0,
            saldo_lancar: parseFloat(item.saldo_lancar) || 0,
            
            stok_bebas: parseFloat(item.stok_bebas) || 0,
            saldo_bebas: parseFloat(item.saldo_bebas) || 0,
            
            stok_titipan_percepatan: parseFloat(item.stok_titipan_percepatan) || 0,
            saldo_titipan_percepatan: parseFloat(item.saldo_titipan_percepatan) || 0,
            mutasi_stok_titipan_percepatan: parseFloat(item.mutasi_stok_titipan_percepatan) || 0,
            mutasi_saldo_titipan_percepatan: parseFloat(item.mutasi_saldo_titipan_percepatan) || 0,
            
            stok_titipan_murni: parseFloat(item.stok_titipan_murni) || 0,
            saldo_titipan_murni: parseFloat(item.saldo_titipan_murni) || 0,
            mutasi_stok_titipan_murni: parseFloat(item.mutasi_stok_titipan_murni) || 0,
            mutasi_saldo_titipan_murni: parseFloat(item.mutasi_saldo_titipan_murni) || 0,
            
            stok_op: parseFloat(item.stok_op) || 0,
            saldo_op: parseFloat(item.saldo_op) || 0,
            
            stok_ppb: parseFloat(item.stok_ppb) || 0,
            saldo_ppb: parseFloat(item.saldo_ppb) || 0,
            
            stok_site: parseFloat(item.stok_site) || 0,
            saldo_site: parseFloat(item.saldo_site) || 0
        }));

        // Categorize data based on type/category
        const categories = {
            ok: processedData.filter(item => item.stok_ok > 0 || item.saldo_ok > 0),
            spprb: processedData.filter(item => item.stok_spprb > 0 || item.saldo_spprb > 0),
            produksi: processedData.filter(item => item.stok_produksi_saat_ini > 0 || item.stok_produksi_lalu > 0),
            distribusi: processedData.filter(item => item.stok_distribusi > 0 || item.saldo_distribusi > 0),
            lancar: processedData.filter(item => item.stok_lancar > 0 || item.saldo_lancar > 0),
            bebas: processedData.filter(item => item.stok_bebas > 0 || item.saldo_bebas > 0),
            'titipan-percepatan': processedData.filter(item => item.stok_titipan_percepatan > 0 || item.saldo_titipan_percepatan > 0),
            'titipan-murni': processedData.filter(item => item.stok_titipan_murni > 0 || item.saldo_titipan_murni > 0),
            op: processedData.filter(item => item.stok_op > 0 || item.saldo_op > 0),
            ppb: processedData.filter(item => item.stok_ppb > 0 || item.saldo_ppb > 0),
            site: processedData.filter(item => item.stok_site > 0 || item.saldo_site > 0)
        };

        // Log processed data summary
        console.log('📊 Processed data summary:', Object.fromEntries(
            Object.entries(categories).map(([k, v]) => [k, `${v.length} items`])
        ));

        // Clear any existing data from localStorage
        Object.keys(categories).forEach(tab => {
            localStorage.removeItem(`wika-data-${tab}`);
        });

        try {
            // Store data in memory and localStorage
            Object.entries(categories).forEach(([tab, items]) => {
                console.log(`📦 Processing ${items.length} items for tab: ${tab}`);
                
                // Store in memory
                window.processedStockDataByTab[tab] = items;
                
                // Store in localStorage
                const key = `wika-data-${tab}`;
                localStorage.setItem(key, JSON.stringify(items));
            });

            // Get current tab and update its charts
            const currentTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
            if (currentTab) {
                console.log(`🔄 Updating charts for current tab: ${currentTab}`);
                const data = categories[currentTab] || [];
                
                // Force charts reinitialization for current tab
                if (typeof initializeCharts === 'function') {
                    initializeCharts(currentTab);
                }
                
                // Update charts with new data
                if (typeof updateCharts === 'function') {
                    updateCharts(currentTab, data);
                }
                
                // Update dashboard data
                if (typeof updateDashboardData === 'function') {
                    updateDashboardData(currentTab);
                }
            }

            showSuccess('Data berhasil diproses dan disimpan');
        } catch (error) {
            console.error('❌ Error processing data:', error);
            showError('Terjadi kesalahan saat memproses data');
        }
    }

    // Header mapping for consistency
    function createHeaderMap(headers) {
        const commonFields = {
            'NPP': 'npp',
            'TAHUN': 'tahun',
            'KATEGORI': 'kategori',
            'WP': 'wp',
            'PPB': 'ppb',
            'SBU': 'sbu',
            'AREA': 'area',
            'PELANGGAN': 'pelanggan',
            'PROYEK': 'proyek',
            'TYPE': 'type',
            'HARSAT': 'harsat',
            'UMUR STOK': 'umur_stok',
            'RANGE UMUR': 'range_umur',
            'KETERANGAN': 'keterangan'
        };

        const stockFields = {
            // OK
            'STOK OK': 'stok_ok',
            'SALDO OK': 'saldo_ok',

            // SPPRB
            'STOK SPPRB': 'stok_spprb',
            'SALDO SPPRB': 'saldo_spprb',

            // PRODUKSI
            'STOK PRODUKSI LALU': 'stok_produksi_lalu',
            'STOK PRODUKSI SAAT INI': 'stok_produksi_saat_ini',

            // DISTRIBUSI
            'STOK DISTRIBUSI': 'stok_distribusi',
            'SALDO DISTRIBUSI': 'saldo_distribusi',
            'MUTASI STOK DISTRIBUSI': 'mutasi_stok_distribusi',
            'MUTASI SALDO DISTRIBUSI': 'mutasi_saldo_distribusi',

            // LANCAR
            'STOK LANCAR': 'stok_lancar',
            'SALDO LANCAR': 'saldo_lancar',

            // BEBAS
            'STOK BEBAS': 'stok_bebas',
            'SALDO BEBAS': 'saldo_bebas',

            // TITIPAN PERCEPATAN
            'STOK TITIPAN PERCEPATAN': 'stok_titipan_percepatan',
            'SALDO TITIPAN PERCEPATAN': 'saldo_titipan_percepatan',
            'MUTASI STOK TITIPAN PERCEPATAN': 'mutasi_stok_titipan_percepatan',
            'MUTASI SALDO TITIPAN PERCEPATAN': 'mutasi_saldo_titipan_percepatan',

            // TITIPAN MURNI
            'STOK TITIPAN MURNI': 'stok_titipan_murni',
            'SALDO TITIPAN MURNI': 'saldo_titipan_murni',
            'MUTASI STOK TITIPAN MURNI': 'mutasi_stok_titipan_murni',
            'MUTASI SALDO TITIPAN MURNI': 'mutasi_saldo_titipan_murni',

            // OP
            'STOK OP': 'stok_op',
            'SALDO OP': 'saldo_op',

            // PPB
            'STOK PPB': 'stok_ppb',
            'SALDO PPB': 'saldo_ppb',

            // SITE
            'STOK SITE': 'stok_site',
            'SALDO SITE': 'saldo_site'
        };

        // Combine all mappings
        const mapping = { ...commonFields, ...stockFields };

        // Handle variations in header names
        headers.forEach(h => {
            const upper = h.trim().toUpperCase();
            if (!mapping[upper]) {
                // Try to match with existing mappings
                const matchingKey = Object.keys(mapping).find(key => 
                    upper.includes(key) || key.includes(upper)
                );
                
                if (matchingKey) {
                    mapping[upper] = mapping[matchingKey];
                } else {
                    // Fallback to converting header to snake_case
                    mapping[upper] = h.toLowerCase().replace(/\s+/g, '_');
                }
            }
        });

        return mapping;
    }

    // Utility functions
    function showLoading(show) {
        loadingIndicator.classList.toggle('hidden', !show);
        uploadContainer.classList.toggle('uploading', show);
    }

    function validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        return validTypes.includes(file.type);
    }

    function showNotification(message, type = 'success') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showError(message) {
        showNotification(message, 'error');
    }
});
