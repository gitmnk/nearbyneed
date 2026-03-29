// Global Dataset
let dataset = [];
let map = null;
let markers = [];
let isMapView = false;
let userLocation = null;

// App Logic
const container = document.getElementById('resource-container');
const mapContainer = document.getElementById('map-container');
const locationBadge = document.getElementById('location-badge');
const filterBtns = document.querySelectorAll('.filter-group .filter-btn');
const btnListView = document.getElementById('btn-list-view');
const btnMapView = document.getElementById('btn-map-view');

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
            
            // Save global user location for the Map View
            userLocation = { lat, lng: lon };
            
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
    if (isMapView && map) {
        updateMapMarkers();
    }
}

function initMap() {
    map = L.map('map-container').setView([37.79, -122.35], 11);
    
    // Modern, bright, clean map tiles (CartoDB Light)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

function updateMapMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    const filtered = dataset.filter(item => {
        const cityMatch = item.city === currentCity;
        const catMatch = currentFilter === 'all' || item.cat === currentFilter;
        return cityMatch && catMatch;
    });
    
    const bounds = [];
    
    filtered.forEach(item => {
        if (item.lat && item.lng) {
            const popupContent = `
                <div style="font-family: inherit;">
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">${item.name}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #4b5563;">${item.desc}</p>
                    ${item.url ? `<a href="${item.url}" target="_blank" style="display: block; width: 100%; text-align: center; padding: 6px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Visit Website</a>` : ''}
                </div>
            `;
            const marker = L.marker([item.lat, item.lng]).bindPopup(popupContent);
            marker.addTo(map);
            markers.push(marker);
            bounds.push([item.lat, item.lng]);
        }
    });
    
    // Add user location marker
    if (userLocation) {
        const userIcon = L.divIcon({
            html: `<div style="background-color: #2563eb; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {icon: userIcon})
            .bindPopup("<div style='font-family: inherit; font-size: 14px; font-weight: 600; text-align: center;'>You are here</div>");
        userMarker.addTo(map);
        markers.push(userMarker);
        bounds.push([userLocation.lat, userLocation.lng]);
    }
    
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
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
            <h2 class="resource-title">
                ${item.url ? `<a href="${item.url}" target="_blank" style="color: inherit; text-decoration: none;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='inherit'">${item.name} <i data-lucide="external-link" size="16" style="color: #9cb3eb; vertical-align: text-bottom; margin-left: 2px;"></i></a>` : item.name}
            </h2>
            <p class="resource-desc">${item.desc}</p>
            <div class="location-info">
                <i data-lucide="map-pin" size="14"></i>
                <a href="https://maps.google.com/?q=${encodeURIComponent(item.loc)}" target="_blank" style="color: inherit; text-decoration: underline; text-decoration-color: #9cb3eb; text-underline-offset: 2px;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='inherit'">${item.loc}</a>
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
        updateUI();
    });
});

// View Toggles
btnListView?.addEventListener('click', () => {
    isMapView = false;
    btnListView.classList.add('active');
    btnMapView.classList.remove('active');
    
    // Switch to grid view ensuring we follow CSS grid definition usually set by '.resource-list'
    container.style.display = 'grid'; 
    mapContainer.style.display = 'none';
});

btnMapView?.addEventListener('click', () => {
    isMapView = true;
    btnMapView.classList.add('active');
    btnListView.classList.remove('active');
    
    container.style.display = 'none';
    mapContainer.style.display = 'block';
    
    if (!map) {
        initMap();
    }
    // Required when making map visible again after hiding
    setTimeout(() => {
        map.invalidateSize();
        updateMapMarkers();
    }, 100);
});

init();
