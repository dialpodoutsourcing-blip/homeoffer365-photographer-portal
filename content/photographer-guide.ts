// Missing approved destinations render an unavailable state rather than a fake link.
export const guideLinks = {
  website: "https://homeoffer365.com",
  team: "/photographers/team",
  stories: "/photographers/homeowner-stories",
  reviews: null as string | null,
  walkthrough: "/videos/interior-sample.mp4",
  upload: "/photographers/upload",
  support: null as string | null,
};

export const walkthroughSample = {
  src: guideLinks.walkthrough,
  poster: "/images/photo-examples/video-poster.jpg",
  description: "A short camera move through a furnished dining and living area, showing how the spaces connect. Bright window glare appears toward the end. This illustrative clip is not a complete property inspection; your assignment still needs every accessible room and visible condition issue.",
};

export const exteriorExamples = [
  {
    src: "/images/photo-examples/exterior.jpg",
    label: "Front / driveway",
    alt: "AI-generated front angle of a two-story house showing its entrance, driveway, garage, and yard",
    note: "Start with a clear view of the front elevation and entrance. Include the driveway and surrounding features, then document details separately.",
  },
  {
    src: "/images/photo-examples/exterior-rear.jpg",
    label: "Rear / backyard",
    alt: "AI-generated rear view showing patio doors, rear windows, a lawn, and an adjacent outbuilding",
    note: "Photograph the rear elevation separately. Show rear doors, windows, patio, backyard, and outbuildings where accessible.",
  },
  {
    src: "/images/photo-examples/exterior-side-garden.jpg",
    label: "Side / garden",
    alt: "AI-generated side angle showing the house wall, a garden, fencing, and a paved path",
    note: "Use a wide side view to show the wall, access path, yard, and boundaries. Add closer photos of visible damage when present.",
  },
  {
    src: "/images/photo-examples/exterior-side-brick.jpg",
    label: "Side / brick wall",
    alt: "AI-generated angled view showing a broad brick side wall, roofline, entrance, and fencing",
    note: "Include the full side elevation and visible roofline. For a real assignment, document both sides separately; these illustrative angles do not verify left/right orientation.",
  },
] as const;

export const photoCategories = [
  {
    id: "exterior", title: "Exterior Photos", number: "01", icon: "house",
    image: "/images/photo-examples/exterior.jpg",
    alt: "AI-generated exterior showing a two-story house, roof, driveway, garage, and yard",
    highlights: ["Front, rear & both sides", "Yard, driveway & outbuildings"],
    shots: ["Front of house", "Rear of house", "Both sides", "Roof and gutters", "Driveway, yard, and outbuildings", "Visible exterior damage"],
    tip: "Take a wide view first, then closer photos of visible damage. Photograph the roof from a safe, accessible location.",
    exampleNote: "Show the building and surrounding features in context. This image demonstrates a front and side view; capture the rear and other side separately too.",
  },
  {
    id: "interior", title: "Interior Photos", number: "02", icon: "sofa",
    image: "/images/photo-examples/interior.jpg",
    alt: "AI-generated interior showing doorways connecting a bathroom, living room, and kitchen",
    highlights: ["Every accessible room", "Layout, condition & key details"],
    shots: ["Living room", "Kitchen and appliances", "All bedrooms", "All bathrooms", "Basement and attic where accessible", "Floors, ceilings, and walls", "Visible damage or needed repairs"],
    tip: "Use well-lit views showing how rooms connect. Include both an overall view and details of visible issues.",
    exampleNote: "Show how rooms connect, then photograph each room individually. Include floors, ceilings, walls, appliances, and visible repairs.",
  },
  {
    id: "mechanical", title: "Mechanical Systems", number: "03", icon: "settings", image: "/images/photo-examples/mechanical.jpg", alt: "AI-generated basement scene with a water heater, furnace, utility sink, and electrical panel",
    highlights: ["HVAC, water heater & panel", "Equipment labels & condition"],
    shots: ["HVAC equipment", "Furnace and air conditioning", "Water heater", "Electrical panel where safely accessible", "Visible plumbing", "Equipment labels and visible condition"],
    tip: "Include readable labels when accessible. Do not open electrical equipment or remove covers to obtain a photo.",
    exampleNote: "Capture an overview of equipment and separate readable label photos where safely accessible. This AI illustration does not establish correct installation, wiring, venting, or safe panel access.",
  },
  {
    id: "condition", title: "Property Condition", number: "04", icon: "scan", image: "/images/photo-examples/condition.jpg", alt: "AI-generated basement scene showing a stair-step wall crack, moisture staining, and damaged ceiling surfaces",
    highlights: ["Overall property condition", "Damage, moisture & repairs"],
    shots: ["Water damage", "Foundation cracks", "Roof leaks", "Mold-like staining", "Fire damage", "Structural concerns", "Unfinished renovations"],
    tip: "Show the issue in context, then capture a closer view. Describe what is visible rather than diagnosing its cause.",
    exampleNote: "Document visible cracks, staining, and damaged surfaces with a wide view and a closer detail. Report what you see without diagnosing the cause or identifying a substance from appearance alone.",
  },
] as const;

export const checklistGroups = [
  { title: "Exterior", items: ["Front, rear, and both sides photographed", "Roof, yard, driveway, and outbuildings documented", "Exterior damage photographed"] },
  { title: "Interior", items: ["Every accessible room photographed", "Kitchen and bathrooms documented", "Basement, attic, and garage photographed where accessible", "Interior damage documented"] },
  { title: "Mechanical", items: ["HVAC system photographed", "Water heater photographed", "Electrical panel photographed where safely accessible", "Visible plumbing and mechanical issues documented"] },
  { title: "Video", items: ["Full walkthrough recorded", "All accessible rooms included", "Major condition issues shown"] },
  { title: "Final submission", items: ["Photos are clear and properly lit", "Property address confirmed", "All required files uploaded", "Missing or inaccessible areas reported", "Assignment ready for submission"] },
] as const;
