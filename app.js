// Seed Data (Simulating fetching from DataSF and Oakland Open Data)
const dataset = [
    // San Francisco
    { city: "SF", name: "GLIDE Daily Meals", cat: "food", desc: "Breakfast, lunch, and dinner served daily. No ID or proof of residency required.", loc: "330 Ellis St, SF", ver: true, upd: "2h ago" },
    { city: "SF", name: "St. Anthony's Dining Room", cat: "food", desc: "Balanced lunch served daily. Open to everyone. 10:00 AM - 1:30 PM.", loc: "121 Golden Gate Ave, SF", ver: true, upd: "1d ago" },
    { city: "SF", name: "MSC South (Shelter)", cat: "shelter", desc: "Largest emergency shelter in SF. Call 311 for bed reservation information.", loc: "525 5th St, SF", ver: true, upd: "4h ago" },
    { city: "SF", name: "Civic Center Water Station", cat: "water", desc: "Clean drinking water bottle filling station. High priority city maintenance.", loc: "Civic Center Plaza, SF", ver: false, upd: "6h ago" },
    
    // Oakland
    { city: "Oakland", name: "St. Vincent de Paul", cat: "food", desc: "Community kitchen serving hot meals. Breakfast: 10:45 AM - 12:45 PM.", loc: "675 23rd St, Oakland", ver: true, upd: "3h ago" },
    { city: "Oakland", name: "CityTeam Oakland", cat: "shelter", desc: "Men's emergency shelter and hot meals. Check-in at 5:00 PM.", loc: "722 Washington St, Oakland", ver: true, upd: "12h ago" },
    { city: "Oakland", name: "Mandela Grocery Co-op", cat: "food", desc: "Food bank partners. Verified distribution point for healthy produce.", loc: "1430 7th St, Oakland", ver: true, upd: "1d ago" },
    { city: "Oakland", name: "DeFremery Park Water", cat: "water", desc: "Public water fountain and bottle fill. Open during park hours.", loc: "1651 Adeline St, Oakland", ver: false, upd: "2d ago" }
];

// App Logic
const container = document.getElementById('resource-container');
const locationBadge = document.getElementById('location-badge');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentCity = "Detecting...";
let currentFilter = "all";

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
            
            updateUI();
        }, () => {
            // Revert to default if blocked
            currentCity = "SF";
            updateUI();
        });
    } else {
        currentCity = "SF";
        updateUI();
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
