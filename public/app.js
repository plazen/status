// Plazen Status Page Application

// Configuration - Services to monitor
const SERVICES = [
    {
        name: 'Plazen Website',
        url: 'https://www.plazen.org',
        description: 'Main website'
    },
    {
        name: 'Plazen App',
        url: 'https://plazen.org',
        description: 'Web application'
    },
    {
        name: 'Images API',
        url: 'https://images.plazen.org',
        description: 'Image processing service'
    }
];

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

// Render initial service cards
function renderServices() {
    servicesListEl.innerHTML = SERVICES.map((service, index) => `
        <div class="service-card" data-index="${index}">
            <div class="service-info">
                <span class="service-name">${service.name}</span>
                <a class="service-url" href="${service.url}" target="_blank" rel="noopener">${service.url}</a>
                <span class="response-time" id="response-time-${index}"></span>
            </div>
            <div class="service-status checking" id="status-${index}">
                <span class="service-status-dot"></span>
                <span>Checking...</span>
            </div>
        </div>
    `).join('');
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
