let currentTab = 'ppb';
let currentSection = 'inventory-section';

// Initialize global state
window.initializedTabs = new Set();
window.dashboardInitialized = false;
window.lastUpdateTime = {};
window.processedStockDataByTab = {};

// Defer initialization until after critical content loads
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        if (window.dashboardInitialized) return;
        
        console.log('🚀 Initializing dashboard application...');
        
        // Setup event listeners using event delegation
        setupEventListeners();
        
        // Initialize default tab efficiently
        const defaultTab = 'ppb';
        const defaultTabContent = document.getElementById('tab-ppb');
        const defaultTabButton = document.querySelector(`.tab[data-tab="${defaultTab}"]`);
        
        if (defaultTabContent && defaultTabButton) {
            // Hide all tab contents except default
            document.querySelectorAll('.tab-content').forEach(content => 
                content.classList.toggle('hidden', content.id !== 'tab-ppb')
            );
            
            // Set active state for default tab
            defaultTabButton.classList.add('active');
            defaultTabButton.setAttribute('aria-selected', 'true');
            defaultTabButton.setAttribute('tabindex', '0');
            
            // Initialize charts for default tab
            Promise.resolve().then(async () => {
                try {
                    if (typeof initializeCharts === 'function') {
                        await initializeCharts(defaultTab);
                        await updateDashboardData(defaultTab);
                        window.initializedTabs.add(defaultTab);
                    }
                } catch (error) {
                    console.error('Error initializing default tab:', error);
                }
            });
        }
        
        // Show inventory section
        showSection('inventory-section');
        
        // Mark initialization complete
        window.dashboardInitialized = true;
    });
});

// Optimize tab switching
window.switchTab = function(tabName) {
    if (!tabName || currentTab === tabName) {
        if (currentTab === tabName) {
            updateDashboardData(tabName);
        }
        return;
    }

    // Ensure we're not switching to the same tab
    if (currentTab === tabName) {
        updateDashboardData(tabName);
        return;
    }

    requestAnimationFrame(async () => {
        try {
            const tabContent = document.getElementById(`tab-${tabName}`);
            if (!tabContent) return;

            // Update tab buttons efficiently
            document.querySelector('.tab.active')?.classList.remove('active');
            const newTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
            if (newTab) {
                newTab.classList.add('active');
                newTab.setAttribute('aria-selected', 'true');
            }

            // Hide previous content first
            const previousContent = document.querySelector('.tab-content:not(.hidden)');
            if (previousContent) {
                previousContent.classList.add('hidden');
                previousContent.setAttribute('aria-hidden', 'true');
            }

            // Show new content
            tabContent.classList.remove('hidden');
            tabContent.setAttribute('aria-hidden', 'false');
            
            // Initialize charts if needed
            if (!window.initializedTabs.has(tabName)) {
                console.log(`Initializing charts for tab: ${tabName}`);
                try {
                    if (typeof initializeCharts === 'function') {
                        await initializeCharts(tabName);
                        window.initializedTabs.add(tabName);
                    }
                } catch (error) {
                    console.error(`Error initializing charts for ${tabName}:`, error);
                }
            }

            // Update current tab before updating data
            currentTab = tabName;

            // Update data immediately
            try {
                await updateDashboardData(tabName);
            } catch (error) {
                console.error(`Error updating dashboard data for ${tabName}:`, error);
            }

            // Ensure proper rendering after transition
            setTimeout(async () => {
                try {
                    await updateDashboardData(tabName);
                } catch (error) {
                    console.error(`Error in delayed update for ${tabName}:`, error);
                }
            }, 300);
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    });
};

// Add global error handler for debugging
window.onerror = function(msg, url, line) {
    console.error('JavaScript error:', msg);
    console.error('At:', url, 'line:', line);
    return false;
};

function initializeDashboard() {
    // Show inventory section by default
    showSection('inventory-section');
    
    // Switch to PPB tab and ensure it shows empty charts
    switchTab('ppb');

    // Clear any existing data from localStorage to ensure fresh start
    const tabs = ['ppb', 'site', 'bebas', 'titipan-percepatan', 'titipan-murni'];
    
    tabs.forEach(tab => {
        localStorage.removeItem(`wika-data-${tab}`);
    });

    // Reset the global data store
    window.processedStockDataByTab = {};
}

function setupEventListeners() {
    setupSidebar();
    setupNavigation();
    setupTabs();
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    const main = document.querySelector('main');

    if (toggleButton && sidebar && main) {
        // Set initial state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            main.style.marginLeft = '80px';
        }

        // Add click handler
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isNowCollapsed = sidebar.classList.contains('collapsed');
            main.style.marginLeft = isNowCollapsed ? '80px' : '280px';
            localStorage.setItem('sidebarCollapsed', isNowCollapsed);
        });
    }
}

function setupNavigation() {
    // Remove any existing event listeners first
    document.querySelectorAll('.nav-link').forEach(link => {
        const clone = link.cloneNode(true);
        link.parentNode.replaceChild(clone, link);
    });

    // Add new event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');
            
            // Handle logout separately
            if (target === 'logout') {
                handleLogout(e);
                return;
            }
            
            e.preventDefault();
            
            if (!target) {
                console.error('Navigation link missing data-target attribute');
                return;
            }
            
            console.log('Navigation clicked:', target);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show section with animation
            showSection(target);
            
            // If switching to inventory section, only update data
            if (target === 'inventory-section' && currentTab) {
                console.log('Updating data for current tab:', currentTab);
                setTimeout(() => {
                    updateDashboardData(currentTab);
                }, 100);
            }
        });
    });
}

function setupTabs() {
    const tabList = document.querySelector('.tab-list');
    if (!tabList) {
        console.error('Tab list not found');
        return;
    }

    // Set tab list attributes once
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-orientation', 'horizontal');

    // Use event delegation for better performance
    tabList.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        e.preventDefault();
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
            switchTab(tabName);
        }
    });

    // Single keyboard event listener using event delegation
    tabList.addEventListener('keydown', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const tabs = Array.from(tabList.querySelectorAll('.tab'));
        const index = tabs.indexOf(tab);
        let newIndex;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIndex = index - 1;
                if (newIndex < 0) newIndex = tabs.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIndex = index + 1;
                if (newIndex >= tabs.length) newIndex = 0;
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                if (tabName) {
                    switchTab(tabName);
                    return;
                }
                break;
            default:
                return;
        }

        if (typeof newIndex !== 'undefined') {
            tabs[newIndex].focus();
            const newTabName = tabs[newIndex].getAttribute('data-tab');
            if (newTabName) switchTab(newTabName);
        }
    });

    // Set initial tab states
    const tabs = tabList.querySelectorAll('.tab');
    tabs.forEach(tab => {
        const isActive = tab.classList.contains('active');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        tab.setAttribute('role', 'tab');
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
    // Prevent showing the same section
    if (currentSection === sectionId) {
        console.log('Section already visible:', sectionId);
        return;
    }

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
            if (sectionId === 'inventory-section' && currentTab) {
                // Only update data if it's been more than 500ms since last update
                const now = Date.now();
                if (!window.lastUpdateTime[currentTab] || (now - window.lastUpdateTime[currentTab] >= 500)) {
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
    console.log('switchTab called with:', tabName);
    if (!tabName) {
        console.error('No tab name provided');
        return;
    }

    try {
        // Don't reinitialize if it's already the current tab
        if (currentTab === tabName) {
            // Even if it's the same tab, ensure data is fresh
            updateDashboardData(tabName);
            return;
        }

        // Update tab buttons and ARIA states
        document.querySelectorAll('.tab').forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
            
            // Update tabindex for keyboard navigation
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Update tab content visibility with transition
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `tab-${tabName}`;
            
            if (isActive) {
                // Show active content with fade
                content.style.opacity = '0';
                content.classList.remove('hidden');
                content.setAttribute('aria-hidden', 'false');
                
                // Initialize charts if needed and update data
                if (!window.initializedTabs.has(tabName) && typeof initializeCharts === 'function') {
                    console.log('Initializing charts for new tab:', tabName);
                    try {
                        initializeCharts(tabName);
                        window.initializedTabs.add(tabName);
                    } catch (error) {
                        console.error("Error initializing charts:", error);
                    }
                }

                // Update data immediately
                updateDashboardData(tabName);

                // Fade in the content
                requestAnimationFrame(() => {
                    content.style.opacity = '1';
                    
                    // Update charts again after transition to ensure proper rendering
                    setTimeout(() => {
                        try {
                            if (typeof updateCharts === 'function') {
                                updateDashboardData(tabName);
                            }
                        } catch (error) {
                            console.error("Error during post-transition update:", error);
                        }
                    }, 300); // Slightly shorter than the CSS transition
                });
            } else {
                // Hide inactive content
                content.classList.add('hidden');
                content.setAttribute('aria-hidden', 'true');
            }
        });

        // Update current tab
        currentTab = tabName;

        // Announce tab change to screen readers
        const liveRegion = document.getElementById('a11y-announce') || 
            (() => {
                const div = document.createElement('div');
                div.id = 'a11y-announce';
                div.setAttribute('role', 'status');
                div.setAttribute('aria-live', 'polite');
                div.className = 'sr-only';
                document.body.appendChild(div);
                return div;
            })();
        liveRegion.textContent = `Switched to ${tabName} tab`;

    } catch (error) {
        console.error('Error switching tabs:', error);
        showError('Error switching tabs. Please try again.');
    }
}

// Track last update timestamp for each tab
window.lastUpdateTime = {};

function updateDashboardData(tabName) {
    if (!tabName) {
        console.error('No tab name provided for update');
        return;
    }

    console.log(`📊 Updating dashboard data for tab: ${tabName}`);
    
    try {
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
            } else {
                console.log(`No data found for tab ${tabName}, using empty dataset`);
                data = [];
            }
        }

        // Ensure we have a valid data array
        if (!Array.isArray(data)) {
            console.warn(`Invalid data format for tab ${tabName}, converting to empty array`);
            data = [];
        }

        // Update charts with the data
        if (typeof updateCharts === 'function') {
            updateCharts(tabName, data);
            console.log(`✅ Charts updated successfully for tab: ${tabName}`);
        } else {
            throw new Error('updateCharts function not found!');
        }

    } catch (error) {
        console.error(`Failed to update dashboard data for tab ${tabName}:`, error);
        // Try to update charts with empty data as fallback
        if (typeof updateCharts === 'function') {
            updateCharts(tabName, []);
        }
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
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification, .error-alert, .success-alert');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="error-icon mr-2" aria-hidden="true">!</span>
            <span class="error-message">${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Remove after delay with animation
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function showSuccess(message) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification, .error-alert, .success-alert');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.setAttribute('role', 'status');
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="success-icon mr-2" aria-hidden="true">✓</span>
            <span class="success-message">${message}</span>
        </div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Remove after delay with animation
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Handle URL hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
        const sectionId = hash.substring(1);
        showSection(sectionId);
    }
});

// Handle logout process
function handleLogout(event) {
    event.preventDefault();

    // Show loading message
    showSuccess('Logging out...');

    try {
        // Clear all data from localStorage
        const tabs =['ppb', 'site', 'bebas','titipan-percepatan', 'titipan murni'];
        
        tabs.forEach(tab => {
            localStorage.removeItem(`wika-data-${tab}`);
        });

    // Clear any other app-specific localStorage items
        localStorage.removeItem('sidebarCollapsed');
        
        // Reset global data stores
        window.processedStockDataByTab = {};
        currentTab = 'ppb';
        currentSection = 'inventory-section';
        
        // Cleanup charts
        Object.keys(charts).forEach(tab => {
            Object.values(charts[tab]).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.warn(`Failed to destroy chart in tab ${tab}:`, error);
                    }
                }
            });
            charts[tab] = {};
        });

        // Clear any pending timeouts
        const highestTimeoutId = setTimeout(";");
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }

        // Show success message
        showSuccess('Successfully logged out. Clearing all data...');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Error during logout:', error);
        showError('Error during logout. Please try again.');
    }
}

// Export utilities for global use
window.storeData = storeData;
window.showError = showError;
window.showSuccess = showSuccess;
window.handleLogout = handleLogout;
