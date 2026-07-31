/**
 * Curated agricultural photography — one cohesive set, each image mapped to
 * the screen where it earns its place. Never random, never wallpaper.
 *
 * Treatment is consistent everywhere: object-fit cover, focal-point-aware
 * cropping, a dark gradient overlay so text stays readable, and a subtle
 * desaturation so the images feel graded as one product.
 */

export interface Photo {
  url: string;
  alt: string;
  /** CSS object-position to keep the subject in frame when cropped */
  position?: string;
}

/* Aerial farmland — Fields list + Dashboard hero */
export const AERIAL_FIELDS: Photo = {
  url: "https://images.pexels.com/photos/4237192/pexels-photo-4237192.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Aerial view of lush green farmland divided into cultivated plots",
  position: "center 40%",
};

export const AERIAL_PATCHWORK: Photo = {
  url: "https://images.pexels.com/photos/32047262/pexels-photo-32047262.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Patchwork of vibrant agricultural fields seen from above",
  position: "center 55%",
};

export const AERIAL_SUNSET: Photo = {
  url: "https://images.pexels.com/photos/33786596/pexels-photo-33786596.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Vast crop fields glowing at sunset",
  position: "center 50%",
};

/* Wheat / golden crops — Crops planner + block detail */
export const WHEAT_CLOSEUP: Photo = {
  url: "https://images.pexels.com/photos/12873375/pexels-photo-12873375.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Golden wheat ears close-up at sunset",
  position: "center 60%",
};

export const WHEAT_BLUE_SKY: Photo = {
  url: "https://images.pexels.com/photos/3905689/pexels-photo-3905689.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Ripe wheat stalks against a bright blue sky",
  position: "center 70%",
};

export const WHEAT_MOUNTAIN: Photo = {
  url: "https://images.pexels.com/photos/38433436/pexels-photo-38433436.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Ripe wheat against a mountain landscape",
  position: "center 45%",
};

/* Soil macro — Soil intelligence */
export const SOIL_HANDS: Photo = {
  url: "https://images.pexels.com/photos/33357663/pexels-photo-33357663.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Dirty hands holding rich wet soil",
  position: "center 50%",
};

export const SOIL_SEEDLINGS: Photo = {
  url: "https://images.pexels.com/photos/30371404/pexels-photo-30371404.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Hands planting green seedlings in soil",
  position: "center 55%",
};

/* Leaf macro — Disease detection */
export const LEAF_DISEASE: Photo = {
  url: "https://images.pexels.com/photos/28166522/pexels-photo-28166522.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Macro of a green leaf with brown spots and decay",
  position: "center 50%",
};

export const LEAF_POWDERY: Photo = {
  url: "https://images.pexels.com/photos/7718268/pexels-photo-7718268.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Leaf affected by powdery mildew, detailed texture",
  position: "center 55%",
};

/* Dramatic skies — Weather */
export const STORM_FIELD: Photo = {
  url: "https://images.pexels.com/photos/12442145/pexels-photo-12442145.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Dark clouds looming over a vast green field",
  position: "center 40%",
};

export const DRAMATIC_WHEAT: Photo = {
  url: "https://images.pexels.com/photos/2340749/pexels-photo-2340749.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Stormy sky over a field of golden crops",
  position: "center 55%",
};

/* Harvest / market — Mandi */
export const HARVEST_COMBINE: Photo = {
  url: "https://images.pexels.com/photos/14502035/pexels-photo-14502035.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Combine harvester working a vast wheat field at harvest",
  position: "center 50%",
};

export const HARVEST_GRAIN: Photo = {
  url: "https://images.pexels.com/photos/23350317/pexels-photo-23350317.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Combine harvester unloading grain into a trailer",
  position: "center 45%",
};

/* Irrigation — Water / block detail */
export const IRRIGATION_SPRINKLER: Photo = {
  url: "https://images.pexels.com/photos/17765487/pexels-photo-17765487.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Sprinkler irrigating a green crop field under blue sky",
  position: "center 50%",
};

export const IRRIGATION_EVENING: Photo = {
  url: "https://images.pexels.com/photos/31231190/pexels-photo-31231190.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Green field with water sprinklers under soft evening light",
  position: "center 55%",
};

/* Research / greenhouse — AI Assistant */
export const GREENHOUSE_PLANTS: Photo = {
  url: "https://images.pexels.com/photos/7299957/pexels-photo-7299957.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Spacious greenhouse with rows of vibrant potted plants",
  position: "center 50%",
};

export const RESEARCH_TABLET: Photo = {
  url: "https://images.pexels.com/photos/6510869/pexels-photo-6510869.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "Woman in a greenhouse studying plants with a tablet",
  position: "center 45%",
};

/** Pick a photo for a given crop id, used on block detail + crops planner */
export function cropPhoto(cropId: string | null): Photo {
  switch (cropId) {
    case "wheat":
      return WHEAT_CLOSEUP;
    case "rice":
      return IRRIGATION_EVENING;
    case "soybean":
      return WHEAT_BLUE_SKY;
    case "maize":
      return WHEAT_MOUNTAIN;
    default:
      return SOIL_SEEDLINGS;
  }
}
