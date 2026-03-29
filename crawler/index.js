import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed Data (Fallback & Baseline)
const seedDataset = [
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

async function fetchSFPublicFacilities() {
    try {
        console.log("Fetching DataSF Public Facilities...");
        // This is a sample DataSF endpoint for Public Restrooms. 
        // We limit to 5 just to prove the dynamic crawler works without overwhelming the UI.
        const res = await fetch('https://data.sfgov.org/resource/vw6y-z8j6.json?$limit=5');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const rawData = await res.json();
        
        // Map the raw API structure to our unified NearbyNeed schema
        const dynamicData = rawData.map(item => ({
            city: "SF",
            name: item.facility_name || "Public Facility",
            cat: "water", // Typically these have pit stops/water
            desc: item.facility_type || item.remarks || "City maintained facility.",
            loc: item.location ? `${item.location.latitude}, ${item.location.longitude}` : "SF",
            ver: true, // It came from the official DataSF API
            upd: "Live Crawler"
        }));
        
        console.log(`Successfully mapped ${dynamicData.length} records from DataSF.`);
        return dynamicData;
    } catch (error) {
        console.error("Failed to fetch DataSF. Falling back to seed data only.", error);
        return [];
    }
}

async function main() {
    console.log("Starting NearbyNeed Static Crawler...");
    
    // 1. Fetch dynamic data from various city APIs
    const sfDynamicData = await fetchSFPublicFacilities();
    // (In the future, add fetchOaklandData() etc.)
    
    // 2. Combine and normalize the data
    const combinedDataset = [...seedDataset, ...sfDynamicData];
    
    // 3. Save to output directory
    const outputDir = path.join(__dirname, '..', 'data');
    const outputFile = path.join(outputDir, 'resources.json');
    
    // Ensure data directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write the JSON array
    await fs.writeFile(outputFile, JSON.stringify(combinedDataset, null, 2));
    
    console.log(`Crawler Finished. Saved ${combinedDataset.length} resources to ${outputFile}`);
}

main();
