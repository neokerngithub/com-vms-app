# Valuation Management System 

Build a production-ready, highly polished Valuation Management System (VMS) web/mobile app. Preserve the current sleek dark theme UI (#0D111D dark background, rounded card surfaces, and pink/indigo gradient accents) while enforcing strict responsive design (max-w-3xl, safe-area insets, dynamic 100dvh viewport) and smooth 60fps micro-interactions.

### 1. CORE MOTTO & PERMISSION ARCHITECTURE

The app centers on two primary universal hubs: Universal Map and Universal Records.

Permission Rules:

- Universal Records: All records are globally viewable by signed-in users.

- Record Creator: The user who created a record can edit (Pencil icon) and view details. They CANNOT delete records.

- Other Users: Non-creators CANNOT edit or delete records. Instead, show a "Report" (Flag icon) action button on card views to allow reporting inaccurate data.

- Admin Users: Only accounts with the 'Admin' role can delete (Trash icon) records.

### 2. DATA MODELS & SCHEMA SETUP

Set up database tables/collections (e.g., Supabase / Firebase) for:

1. Records Table (Market Valuation Data):

   - id (uuid)

   - site_visited_by (text)

   - location_in_cadastral_map (text)

   - district (text)

   - coordinates (lat/lng, e.g., 26.448557, 87.282560)

   - market_rate (numeric)

   - unit (enum: 'Dhur', 'Kattha', 'Bigha', 'Ropani', 'Aana', 'Paisa', 'Daam', 'Sq. Ft.', 'Sq. M.')

   - road_width (text)

   - type_of_road (enum: 'Pitched road', 'Gravelled road', 'Block / Paved road', 'RCC road', 'Earthen road')

   - locality (enum: 'Residential', 'Commercial', 'Commercial / Residential', 'Residential / Agricultural')

   - data_entry_date (timestamp)

   - remarks (text)

   - image_url (text, optional)

   - created_by (user_id reference)

   - reports_count (numeric, default 0)

2. Government Rates Reference Table:

   - id (uuid)

   - fiscal_year (text, e.g., '2082-83', '2081-82')

   - district_office (text, e.g., 'Biratnagar, Morang', 'Inaruwa, Sunsari')

   - pdf_url (text link)

3. Area Conversions / Arithmetic Engine:

   - Handle Nepalese land units with absolute precision:

     * Terai System: 1 Bigha = 20 Kattha = 400 Dhur = 800 Kanwa. (1 Dhur ≈ 182.25 Sq. Ft. / 16.93 Sq. M.)

     * Hilly System: 1 Ropani = 16 Aana = 64 Paisa = 256 Daam. (1 Ropani ≈ 5476 Sq. Ft. / 508.737 Sq. M.)

     * Metric: Ha, Sq. M., Sq. Ft.

4. Advanced Calculator Table:

   - Inputs: Input Area, Input Unit, Gov. Rate, Gov. Rate Unit, Market Rate, Market Rate Unit, Gov. Share %, Market Share % (locked to total 100%), Distress % (default 85%).

   - Formulas:

     * Area in Sq. Ft. = [Input Area normalized to Sq. Ft.]

     * Normalized Gov Rate per Sq. Ft. = [Gov. Rate / Sq. Ft. of Gov. Unit]

     * Normalized Market Rate per Sq. Ft. = [Market Rate / Sq. Ft. of Market Unit]

     * Commercial Value = Area in Sq. Ft. × Normalized Market Rate

     * Government Value = Area in Sq. Ft. × Normalized Gov Rate

     * Fair Market Value = (Government Value × Gov. Share %) + (Commercial Value × Market Share %)

     * Distress Value = Fair Market Value × Distress %

### 3. NAVIGATION & UI STRUCTURE

1. Persistent Bottom Navigation Bar:

   - Tabs: Map, Records, Converter.

   - Active Tab State: High-contrast highlighted container with pink-to-blue gradient fill.

   - Floating Action Button (FAB): ' Add Record' button positioned relative to the screen (bottom-20 right-4) to avoid overlapping the bottom navbar or card action buttons.

2. Drawer / Sidebar Navigation:

   - Contains: Profile, Advanced Calculator, Government Rates Library, Support / Contact, Sign Out.

3. Top Bar:

   - Hamburger icon (triggers sidebar) and dynamic page title ('Records', 'Converter', 'Advanced Calculator', etc.).

### 4. SCREEN SPECIFIC IMPLEMENTATIONS

- Map View: Universal map displaying all records as interactive pins. Tapping a pin opens a quick preview card with location, market rate, and creator info.

- Records View: Search bar ('Search location, address, ward...') with top filter pills ('Newest', 'Oldest', 'Highest Rs', 'Lowest Rs'). Card feed displaying property details, photo thumbnails (or default location icon), creator name, and conditional action icons (Pin, Edit for owner, Report for others, Trash for Admin).

- Converter Screen: 

  * Tab 1 (Convert): Single value conversion instantly showing equivalent values across Hilly, Terai, and Metric units.

  * Tab 2 (Arithmetic): Add (+) or subtract (-) multiple land area rows across different units (e.g., 2 Kattha + 10 Dhur - 300 Sq. Ft.) and output total result cleanly.

- Advanced Calculator Screen: Input fields for Property Area, Rates, Weighting Sliders, and a consolidated summary card displaying Commercial Value, Government Value, Fair Market Value, and Distress Value in real-time NPR.

- Government Rates Screen: Filterable list by Fiscal Year (2082-83, 2081-82, 2080-81) and District/Office (Morang, Sunsari, Jhapa, Dhankuta) with direct PDF view/download buttons.

### 5. UI & UX QUALITY (10/10 BAR)

- Add active micro-interactions (`active:scale-95 transition-transform duration-150`) on buttons and cards.

- Ensure all text elements are high-contrast for daylight readability (`#94A3B8` / `#F8FAFC`).

- Ensure full mobile and tablet responsiveness without horizontal scrolling or distorted layouts.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://com-vms-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/00f58f01-fbab-4102-a022-4a28509cf032).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
