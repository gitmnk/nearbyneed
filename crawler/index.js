import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchSFPublicFacilities(crawlTime) {
    try {
        console.log("Fetching DataSF Public Facilities...");
        // This is a sample DataSF endpoint for Public Restrooms/Water.
        const res = await fetch('https://data.sfgov.org/resource/vw6y-z8j6.json?$limit=10');
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
            upd: crawlTime // Use the precise time the crawler ran
        }));
        
        console.log(`Successfully mapped ${dynamicData.length} records from DataSF.`);
        return dynamicData;
    } catch (error) {
        console.error("Failed to fetch DataSF.", error);
        return [];
    }
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
    
    // 1. Fetch dynamic data from various city APIs
    const sfDynamicData = await fetchSFPublicFacilities(crawlTime);
    // (In the future, we will combine with OaklandData, etc.)
    const combinedDataset = [...sfDynamicData];
    
    // 2. Save to output directory
    const outputDir = path.join(__dirname, '..', 'data');
    const outputFile = path.join(outputDir, 'resources.json');
    
    // Ensure data directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write the JSON array
    await fs.writeFile(outputFile, JSON.stringify(combinedDataset, null, 2));
    
    console.log(`Crawler Finished. Saved ${combinedDataset.length} resources to ${outputFile}`);
}

main();
