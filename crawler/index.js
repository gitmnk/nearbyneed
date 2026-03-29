import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial Curated Database
const curatedDataset = [
    { city: "SF", name: "GLIDE Daily Meals", cat: "food", desc: "Breakfast, lunch, and dinner served daily.", loc: "330 Ellis St, SF", url: "https://www.glide.org", lat: 37.7853, lng: -122.4115 },
    { city: "SF", name: "St. Anthony's Dining Room", cat: "food", desc: "Balanced lunch served daily. Open to everyone. 10:00 AM - 1:30 PM.", loc: "121 Golden Gate Ave, SF", url: "https://www.stanthonysf.org", lat: 37.7820, lng: -122.4121 },
    { city: "SF", name: "MSC South (Shelter)", cat: "shelter", desc: "Largest emergency shelter in SF. Call 311 for bed reservation information.", loc: "525 5th St, SF", url: "https://hsh.sfgov.org", lat: 37.7772, lng: -122.3967 },
    { city: "SF", name: "Civic Center Water Station", cat: "water", desc: "Clean drinking water bottle filling station. High priority city maintenance.", loc: "Civic Center Plaza, SF", url: "https://sfwater.org", lat: 37.7794, lng: -122.4168 },
    { city: "Oakland", name: "St. Vincent de Paul", cat: "food", desc: "Community kitchen serving hot meals. Breakfast: 10:45 AM - 12:45 PM.", loc: "675 23rd St, Oakland", url: "https://www.svdp-alameda.org", lat: 37.8132, lng: -122.2701 },
    { city: "Oakland", name: "CityTeam Oakland", cat: "shelter", desc: "Men's emergency shelter and hot meals. Check-in at 5:00 PM.", loc: "722 Washington St, Oakland", url: "https://cityteam.org/oakland", lat: 37.8005, lng: -122.2753 },
    { city: "Oakland", name: "Mandela Grocery Co-op", cat: "food", desc: "Food bank partners. Verified distribution point for healthy produce.", loc: "1430 7th St, Oakland", url: "https://www.mandelagrocery.coop", lat: 37.8052, lng: -122.2964 },
    { city: "Oakland", name: "DeFremery Park Water", cat: "water", desc: "Public water fountain and bottle fill. Open during park hours.", loc: "1651 Adeline St, Oakland", url: "https://www.oaklandparks.org", lat: 37.8135, lng: -122.2858 }
];

async function fetchCuratedResources(crawlTime) {
    console.log("Fetching Curated Database...");
    
    // In Phase 2, you will replace this with fetch() calls to the specific DataSF Food/Shelter endpoints!
    return curatedDataset.map(item => ({
        ...item,
        ver: true,
        upd: `${crawlTime} (Source: Curated Local Database)`
    }));
}

async function main() {
    console.log("Starting NearbyNeed Static Crawler...");
    
    // Generate the exact time the crawler runs
    const crawlTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'medium',
        timeStyle: 'short'
    });
    console.log(`Crawl timestamp: ${crawlTime}`);
    
    const combinedDataset = await fetchCuratedResources(crawlTime);
    
    // Save to output directory
    const outputDir = path.join(__dirname, '..', 'data');
    const outputFile = path.join(outputDir, 'resources.json');
    
    // Ensure data directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write the JSON array
    await fs.writeFile(outputFile, JSON.stringify(combinedDataset, null, 2));
    
    console.log(`Crawler Finished. Saved ${combinedDataset.length} resources to ${outputFile}`);
}

main();
