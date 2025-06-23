let currentTab = 'ok';
let currentSection = 'inventory-section';

document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    setupEventListeners();
    handleInitialNavigation();
});

function initializeDashboard() {
    if (typeof initializeDefaultCharts === 'function') {
        initializeDefaultCharts();
    }
    showSection('inventory-section');
    switchTab('ok');
}

function setupEventListeners() {
    setupSidebar();
    setupNavigation();
    setupTabs();
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggleSidebar');

    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');
            if (!target) return;
            
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show section with animation
            showSection(target);
        });
    });
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                e.preventDefault();
                switchTab(tabName);
            }
        });
    });
}

function handleInitialNavigation() {
    const hash = window.location.hash;
    if (hash) {
        const sectionId = hash.substring(1);
        showSection(sectionId);

        const navLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (navLink) {
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            navLink.classList.add('active');
        }
    }
}

function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Fade out all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.transition = 'opacity 0.5s ease-in-out';
        section.style.opacity = '0';
    });

    // After fade out completes, hide all sections and show target
    setTimeout(() => {
        sections.forEach(section => section.classList.add('hidden'));
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            // Show new section
            targetSection.classList.remove('hidden');
            
            // Force reflow and fade in
            targetSection.offsetHeight;
            requestAnimationFrame(() => {
                targetSection.style.opacity = '1';
            });

            currentSection = sectionId;

            // Initialize section-specific functionality
            if (sectionId === 'inventory-section') {
                if (typeof initializeCharts === 'function') {
                    initializeCharts(currentTab);
                }
                if (currentTab) {
                    updateDashboardData(currentTab);
                }
            } else if (sectionId === 'upload-section') {
                // Reset upload section
                const previewSection = document.getElementById('preview-section');
                if (previewSection) {
                    previewSection.classList.add('hidden');
                }
                const fileInput = document.getElementById('excelFile');
                if (fileInput) {
                    fileInput.value = '';
                }
            }

            // Update URL hash without scrolling
            const scrollPosition = window.scrollY;
            window.location.hash = sectionId;
            window.scrollTo(0, scrollPosition);
        }
    }, 500); // Match transition duration
}

function switchTab(tabName) {
    if (!tabName) return;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        const isActive = tab.getAttribute('data-tab') === tabName;
        tab.classList.toggle('active', isActive);
    });

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }

    // Update current tab and reinitialize charts
    currentTab = tabName;
    
    if (typeof initializeCharts === 'function') {
        initializeCharts(tabName);
    }
    
    updateDashboardData(tabName);
}

function updateDashboardData(tabName) {
    // Try to get data from memory first
    let data = window.processedStockDataByTab?.[tabName];
    
    // If not in memory, try localStorage
    if (!data) {
        const key = `wika-data-${tabName}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            try {
                data = JSON.parse(stored);
                // Update memory cache
                window.processedStockDataByTab = window.processedStockDataByTab || {};
                window.processedStockDataByTab[tabName] = data;
            } catch (e) {
                console.error("Error parsing stored data:", e);
                data = [];
            }
        }
    }

    // Update charts
    if (typeof updateCharts === 'function') {
        updateCharts(tabName, data || []);
    }
}

function getStoredData(tabName) {
    const key = `wika-data-${tabName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

function storeData(tabName, data) {
    const key = `wika-data-${tabName}`;
    localStorage.setItem(key, JSON.stringify(data));

    if (currentTab === tabName && currentSection === 'inventory-section') {
        updateDashboardData(tabName);
    }
}

function showError(message) {
    const div = document.createElement('div');
    div.className = 'error-alert';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'success-alert';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Handle URL hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
        const sectionId = hash.substring(1);
        showSection(sectionId);
    }
});

// Export utilities for global use
window.storeData = storeData;
window.showError = showError;
window.showSuccess = showSuccess;
