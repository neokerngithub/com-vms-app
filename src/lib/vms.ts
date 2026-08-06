export const ROAD_TYPES = [
  "Pitched road",
  "Gravelled road",
  "Block / Paved road",
  "RCC road",
  "Earthen road",
] as const;

export const LOCALITIES = [
  "Residential",
  "Commercial",
  "Commercial / Residential",
  "Residential / Agricultural",
] as const;

export const FISCAL_YEARS = [
  "2089/90",
  "2088/89",
  "2087/88",
  "2086/87",
  "2085/86",
  "2084/85",
  "2083/84",
  "2082/83",
  "2081/82",
  "2080/81",
] as const;

export const DEFAULT_FISCAL_YEAR = "2083/84";


export interface VmsRecord {
  id: string;
  site_visited_by: string;
  location_in_cadastral_map: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  market_rate: number;
  unit: string;
  road_width: string | null;
  type_of_road: string | null;
  locality: string | null;
  data_entry_date: string;
  remarks: string | null;
  image_url: string | null;
  created_by: string;
  reports_count: number;
  created_at: string;
}

export interface GovRate {
  id: string;
  fiscal_year: string;
  district_office: string;
  pdf_url: string;
}
