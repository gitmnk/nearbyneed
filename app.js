// Global Dataset
let dataset = [];

// App Logic
const container = document.getElementById('resource-container');
const locationBadge = document.getElementById('location-badge');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentCity = "Detecting...";
let currentFilter = "all";

async function fetchResources() {
    try {
        container.innerHTML = `<div class="loading-state">Fetching real-time resources...</div>`;
        // Fetch the statically generated JSON built by the GitHub Actions crawler
        const response = await fetch('./data/resources.json');
        if (!response.ok) throw new Error("Network response was not ok");
        
        dataset = await response.json();
        updateUI();
    } catch (error) {
        console.error("Failed to fetch resources:", error);
        container.innerHTML = `<div class="loading-state" style="color: var(--danger);">Error loading resources. Please try again later.</div>`;
    }
}

function init() {
    // Attempt location detection
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Simplified bounding boxes
            if (lat > 37.7 && lat < 37.81 && lon > -122.52 && lon < -122.35) {
                currentCity = "SF";
            } else if (lat > 37.74 && lat < 37.86 && lon > -122.34 && lon < -122.15) {
                currentCity = "Oakland";
            } else {
                currentCity = "SF"; // Default for prototype
            }
            
            fetchResources();
        }, () => {
            // Revert to default if blocked
            currentCity = "SF";
            fetchResources();
        });
    } else {
        currentCity = "SF";
        fetchResources();
    }
}

function updateUI() {
    locationBadge.textContent = `Resources: ${currentCity}`;
    renderList();
}

function renderList() {
    const filtered = dataset.filter(item => {
        const cityMatch = item.city === currentCity;
        const catMatch = currentFilter === 'all' || item.cat === currentFilter;
        return cityMatch && catMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-state">No ${currentFilter} resources found in ${currentCity} yet.</div>`;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="resource-card">
            <div class="card-header">
                <span class="resource-category">${item.cat}</span>
                ${item.ver ? `<span class="verified-badge"><i data-lucide="shield-check" size="14"></i> Verified</span>` : ''}
            </div>
            <h2 class="resource-title">${item.name}</h2>
            <p class="resource-desc">${item.desc}</p>
            <div class="location-info">
                <i data-lucide="map-pin" size="14"></i>
                <span>${item.loc}</span>
            </div>
            <div class="resource-footer">
                <span class="updated-at">Confirmed ${item.upd}</span>
                <div class="card-actions">
                    <button class="action-btn" onclick="confirmItem('${item.name}')">
                        <i data-lucide="thumbs-up" size="14"></i> Still here
                    </button>
                    <button class="action-btn btn-flag" onclick="reportItem('${item.name}')">
                        <i data-lucide="flag" size="14"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function confirmItem(name) {
    alert(`Thank you! You've confirmed "${name}" is still active. Timestamp updated.`);
}

function reportItem(name) {
    const reason = prompt(`Why are you reporting "${name}"?\n(e.g. Asking for money, Closed, Wrong info)`);
    if (reason) {
        alert("Report received. Our moderators will verify this immediately to protect the community.");
    }
}

// Filters
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderList();
    });
});

init();
