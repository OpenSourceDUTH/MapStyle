/*
 * Cartographic POI icon mapping.
 *
 * PostGIS describes what a POI is.
 * This module decides which Maki symbol represents it and
 * constructs the MapLibre sprite-name expressions used by
 * the renderer.
 */


export const fallbackPoiIcon = 'marker';


export const poiIconBySubtype = {
    /*
     * Education
     */
    university: 'college',
    school: 'school',
    kindergarten: 'school',
    library: 'library',

    /*
     * Food
     */
    restaurant: 'restaurant',
    cafe: 'cafe',
    fast_food: 'fast-food',
    bar: 'bar',
    pub: 'bar',
    ice_cream: 'ice-cream',
    food_court: 'restaurant',

    /*
     * Health
     */
    hospital: 'hospital',
    clinic: 'doctor',
    doctors: 'doctor',
    doctor: 'doctor',
    pharmacy: 'pharmacy',
    veterinary: 'veterinary',
    rehabilitation: 'doctor',

    /*
     * Leisure
     */
    fitness_centre: 'fitness-centre',
    bathing_place: 'swimming',
    beach_resort: 'beach',
    marina: 'harbor',
    park: 'park',
    slipway: 'slipway',
    picnic_table: 'picnic-site',

    /*
     * Services
     */
    fuel: 'fuel',

    bank: 'bank',
    atm: 'bank',

    government: 'town-hall',
    'government;water_utility': 'town-hall',

    post_office: 'post',

    car_wash: 'car',
    car_rental: 'car-rental',

    lawyer: 'commercial',
    estate_agent: 'commercial',
    insurance: 'commercial',
    logistics: 'commercial',
    moving_company: 'commercial',
    telecommunication: 'commercial',
    translator: 'commercial',
    energy_supplier: 'commercial',

    research: 'college',

    carpenter: 'shop',
    confectionery: 'bakery',
    boatbuilder: 'shop',
    brewery: 'bar',
    handicraft: 'shop',
    shoemaker: 'shop',

    political_party: 'town-hall',
    union: 'commercial',

    /*
     * Shopping
     */
    supermarket: 'grocery',
    convenience: 'grocery',

    bakery: 'bakery',
    pastry: 'bakery',

    butcher: 'grocery',
    greengrocer: 'grocery',
    deli: 'grocery',
    seafood: 'grocery',
    beverages: 'grocery',
    nuts: 'grocery',

    kiosk: 'shop',
    department_store: 'shop',
    mall: 'shop',
    bookmaker: 'shop',
    lottery: 'shop',
    ticket: 'shop',
    newsagent: 'shop',
    doityourself: 'shop',
    hardware: 'shop',

    'fishing;hunting': 'shop',

    clothes: 'clothing-store',
    shoes: 'shoe',
    jewelry: 'jewelry-store',
    gift: 'gift',

    electronics: 'shop',
    electrical: 'shop',
    computer: 'shop',

    mobile_phone: 'mobile-phone',

    books: 'library',
    stationery: 'shop',

    hairdresser: 'hairdresser',
    beauty: 'hairdresser',
    cosmetics: 'hairdresser',

    florist: 'garden',
    furniture: 'furniture',

    car: 'car',
    car_parts: 'car',
    car_repair: 'car-repair',
    tyres: 'car',
    motorcycle: 'car',

    optician: 'optician',
    hearing_aids: 'doctor',

    toys: 'shop',
    pet: 'veterinary',

    coffee: 'cafe',

    photo: 'shop',
    travel_agency: 'commercial',

    musical_instrument: 'music',

    dry_cleaning: 'shop',
    hifi: 'shop',

    yes: 'shop',

    /*
     * Tourism / history
     */
    information: 'information',
    viewpoint: 'viewpoint',

    hotel: 'lodging',
    apartment: 'lodging',
    guest_house: 'lodging',
    motel: 'lodging',

    museum: 'museum',
    gallery: 'art-gallery',

    attraction: 'attraction',

    archaeological_site: 'historic',
    ruins: 'historic',

    castle: 'castle',
    fort: 'castle',

    monument: 'monument',
    memorial: 'monument',

    artwork: 'art-gallery',

    camp_site: 'campsite',
    theme_park: 'amusement-park',

    wayside_shrine: 'religious-christian',
    place_of_worship: 'religious-christian',

    city_gate: 'historic',
    building: 'historic',

    külliye: 'religious-christian',
    madrasa: 'religious-christian',

    mine: 'historic',

    theatre: 'theatre',
    townhall: 'town-hall',

    /*
     * Utilities / civic
     */
    parking: 'parking',
    parking_entrance: 'parking',

    charging_station: 'charging-station',

    taxi: 'taxi',

    toilets: 'toilet',
    shower: 'toilet',

    drinking_water: 'drinking-water',
    fountain: 'water',

    shelter: 'shelter',

    police: 'police',
    fire_station: 'fire-station',

    courthouse: 'town-hall',

    recycling: 'recycling',

    cinema: 'cinema',

    marketplace: 'shop',
    nightclub: 'bar',

    telephone: 'telephone',

    post_box: 'post',

    public_bookcase: 'library',
    vending_machine: 'shop',

    nursing_home: 'hospital',

    studio: 'commercial',

    waste_disposal: 'recycling',
    waste_basket: 'recycling',

    harbourmaster: 'harbor',

    vehicle_inspection: 'car',
    driving_school: 'car',

    bus_station: 'bus',

    binoculars: 'viewpoint',

    dressing_room: 'toilet'
};


/*
 * Bare Maki icon expression.
 *
 * This is still useful for places where we need only the
 * underlying glyph rather than the composite marker.
 */
export const poiIconExpression = [
    'match',
    ['get', 'subtype'],

    ...Object.entries(
        poiIconBySubtype
    ).flat(),

    fallbackPoiIcon
];


/*
 * Complete set of Maki icons required by the sprite builder.
 *
 * Set removes duplicates because many semantic subtypes map
 * to the same cartographic symbol.
 */
export const requiredPoiIcons = [
    ...new Set([
        fallbackPoiIcon,

        ...Object.values(
            poiIconBySubtype
        ),

        /*
         * Reserved for transit layers.
         */
        'bus',
        'rail'
    ])
];


/*
 * Convert the database category into one of the categories for
 * which the sprite builder generates composite POI markers.
 *
 * Anything unknown safely falls back to "other".
 */
export const poiCategoryExpression = [
    'match',
    ['get', 'category'],

    'food', 'food',
    'health', 'health',
    'education', 'education',
    'shopping', 'shopping',
    'tourism', 'tourism',
    'service', 'service',
    'utility', 'utility',
    'leisure', 'leisure',

    'other'
];


/*
 * Build the composite sprite name at render time.
 *
 * Examples:
 *
 * education-college
 * food-restaurant
 * health-pharmacy
 * tourism-museum
 *
 * The sprite builder generates images with exactly these names.
 */
export const poiMarkerImageExpression = [
    'concat',

    poiCategoryExpression,

    '-',

    poiIconExpression
];


/*
 * JavaScript-side resolver.
 *
 * Useful outside MapLibre expressions, such as search results,
 * UI components and debugging.
 */
export function getPoiIcon(
    subtype
) {
    if (!subtype) {
        return fallbackPoiIcon;
    }

    return (
        poiIconBySubtype[subtype]
        ?? fallbackPoiIcon
    );
}