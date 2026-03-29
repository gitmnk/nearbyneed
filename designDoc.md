# NearbyNeed Design Document

**Goal**: A high-speed, trusted, zero-money platform for finding homeless resources in San Francisco and Oakland.

## Core Principles

- **Zero-Money Guarantee**: All transactions on the platform are $0. Any request for money is a violation of community trust.
- **Trust via Verification**: Resources are marked as "Verified" when seeded from official city data or vetted by admins.
- **Freshness via Community**: "Still Here" (thumbs up) feature allows real-time confirmation from people at the location.
- **Immediate Misuse Prevention**: "Report" (flag) feature with immediate auto-hide thresholds for flagged items.
- **Performance First**: Minimalist Vanilla HTML/CSS/JS architecture for near-instant loading on low-end devices or poor connections.

## Core Features

1.  **Location-Aware Discovery**: Automatically detects user location (SF or Oakland) and shows relevant resources immediately. No search bar for maximum speed.
2.  **Verified Seed Data**: Initial resources are pulled from official SF (DataSF) and Oakland Open Data portals.
3.  **Community Feedback Loop**:
    - **Still Here**: Refreshes the "Last Confirmed" timestamp.
    - **Report Issue**: Flags incorrect info, closed locations, or misuse/fraud.
4.  **Accessibility**: Clean, high-contrast typography and simple navigation for diverse user needs.

## Data Sourcing

Detailed resource information is sourced and verified from:
- **San Francisco**: [DataSF](https://datasf.org/) (SODA API for Homelessness and Social Services).
- **Oakland**: [City of Oakland Open Data](https://data.oaklandca.gov/) (311 and Social Services datasets).
- **Secondary Reference**: [Bay Area 211](https://www.211bayarea.org/).

## Technical Stack

- **Frontend**: Vanilla HTML5, CSS3 (Grid/Flex), ES6+ Javascript.
- **Icons**: [Lucide Icons](https://lucide.dev/).
- **Fonts**: Inter (Google Fonts).
- **Infrastructure**: Designed for PWA (Progressive Web App) capabilities in future phases.
