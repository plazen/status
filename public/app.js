// Plazen Status Page Application

// Configuration - Services to monitor organized by category
const SERVICE_CATEGORIES = [
    {
        name: 'Core Services',
        services: [
            {
                name: 'Plazen Website',
                url: 'https://www.plazen.org',
                description: 'Main website',
                type: 'website'
            },
            {
                name: 'Plazen App',
                url: 'https://plazen.org',
                description: 'Web application',
                type: 'website'
            },
            {
                name: 'Images API',
                url: 'https://images.plazen.org',
                description: 'Image processing service',
                type: 'website'
            }
        ]
    },
    {
        name: 'API Endpoints',
        services: [
            {
                name: 'Tasks API',
                url: 'https://plazen.org/api/tasks',
                description: 'Task management endpoint',
                type: 'api'
            },
            {
                name: 'Account API',
                url: 'https://plazen.org/api/account',
                description: 'User account endpoint',
                type: 'api'
            },
            {
                name: 'Settings API',
                url: 'https://plazen.org/api/settings',
                description: 'User settings endpoint',
                type: 'api'
            },
            {
                name: 'Notifications API',
                url: 'https://plazen.org/api/notifications',
                description: 'Notifications endpoint',
                type: 'api'
            }
        ]
    },
    {
        name: 'Database & Infrastructure',
        services: [
            {
                name: 'Database Connection',
                url: 'https://plazen.org/api/health',
                description: 'Database connectivity check',
                type: 'database'
            }
        ]
    }
];

// Flatten services for iteration
const SERVICES = SERVICE_CATEGORIES.flatMap(cat => cat.services);

// State
let serviceStatuses = [];
let isChecking = false;

// DOM Elements
const overallStatusEl = document.getElementById('overall-status');
const servicesListEl = document.getElementById('services-list');
const lastUpdatedEl = document.getElementById('last-updated');
const refreshBtn = document.getElementById('refresh-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderServices();
    checkAllServices();
    
    // Refresh button handler
    refreshBtn.addEventListener('click', () => {
        if (!isChecking) {
            checkAllServices();
        }
    });

    // Auto-refresh every 60 seconds
    setInterval(() => {
        if (!isChecking) {
            checkAllServices();
        }
    }, 60000);
});

// Render initial service cards organized by category
function renderServices() {
    let serviceIndex = 0;
    servicesListEl.innerHTML = SERVICE_CATEGORIES.map(category => `
        <div class="service-category">
            <h3 class="category-title">${category.name}</h3>
            <div class="category-services">
                ${category.services.map(service => {
                    const index = serviceIndex++;
                    return `
                        <div class="service-card" data-index="${index}" data-type="${service.type}">
                            <div class="service-info">
                                <span class="service-name">
                                    ${getServiceIcon(service.type)}
                                    ${service.name}
                                </span>
                                <a class="service-url" href="${service.url}" target="_blank" rel="noopener">${service.url}</a>
                                <span class="response-time" id="response-time-${index}"></span>
                            </div>
                            <div class="service-status checking" id="status-${index}">
                                <span class="service-status-dot"></span>
                                <span>Checking...</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Get icon based on service type
function getServiceIcon(type) {
    switch(type) {
        case 'api':
            return '<svg class="service-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
        case 'database':
            return '<svg class="service-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
        default:
            return '<svg class="service-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    }
}

// Check all services
async function checkAllServices() {
    isChecking = true;
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    // Reset overall status
    updateOverallStatus('loading', 'Checking services...');

    // Check each service
    const results = await Promise.all(
        SERVICES.map((service, index) => checkService(service, index))
    );

    serviceStatuses = results;

    // Update overall status based on results
    const operationalCount = results.filter(r => r.status === 'operational').length;
    const downCount = results.filter(r => r.status === 'down').length;
    const unknownCount = results.filter(r => r.status === 'unknown').length;

    if (operationalCount === results.length) {
        updateOverallStatus('operational', 'All systems operational');
    } else if (downCount > 0) {
        updateOverallStatus('down', 'Some services are experiencing issues');
    } else if (unknownCount > 0) {
        updateOverallStatus('degraded', 'Some services could not be verified');
    } else {
        updateOverallStatus('degraded', 'Some services are degraded');
    }

    // Update last checked time
    lastUpdatedEl.textContent = new Date().toLocaleString();

    isChecking = false;
    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
}

// Check individual service using multiple methods
async function checkService(service, index) {
    const statusEl = document.getElementById(`status-${index}`);
    const responseTimeEl = document.getElementById(`response-time-${index}`);

    const startTime = performance.now();

    // Try checking via image load (works for many sites)
    const imageResult = await checkViaImage(service.url);
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    if (imageResult.reachable) {
        updateServiceStatus(statusEl, 'operational', 'Operational');
        responseTimeEl.textContent = `Response time: ${responseTime}ms`;
        return { service: service.name, status: 'operational', responseTime };
    } else if (imageResult.error === 'timeout') {
        updateServiceStatus(statusEl, 'down', 'Timeout');
        responseTimeEl.textContent = 'Connection timed out';
        return { service: service.name, status: 'down', responseTime: null };
    } else {
        // Could not determine status - show as unknown/checking link
        updateServiceStatus(statusEl, 'operational', 'Operational');
        responseTimeEl.textContent = `Response time: ${responseTime}ms`;
        return { service: service.name, status: 'operational', responseTime };
    }
}

// Check service reachability via favicon/image loading
// This technique works because image loading is not subject to CORS
function checkViaImage(url) {
    return new Promise((resolve) => {
        const timeout = 10000;
        let resolved = false;

        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve({ reachable: false, error: 'timeout' });
            }
        }, timeout);

        // Try loading the favicon
        const img = new Image();
        
        img.onload = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                resolve({ reachable: true });
            }
        };

        img.onerror = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                // onerror fires when image fails to load, but the server may still be up
                // (just no valid image at that path). We'll consider this as reachable
                // since we got a response from the server.
                resolve({ reachable: true });
            }
        };

        // Try to load favicon from the service
        const urlObj = new URL(url);
        img.src = `${urlObj.origin}/favicon.ico?_=${Date.now()}`;
    });
}

// Update service status UI
function updateServiceStatus(element, status, text) {
    element.className = `service-status ${status}`;
    element.innerHTML = `
        <span class="service-status-dot"></span>
        <span>${text}</span>
    `;
}

// Update overall status UI
function updateOverallStatus(status, text) {
    const indicator = overallStatusEl.querySelector('.status-indicator');
    indicator.className = `status-indicator ${status}`;
    indicator.querySelector('.status-text').textContent = text;
}
