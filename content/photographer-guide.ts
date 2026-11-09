// Missing approved destinations render an unavailable state rather than a fake link.
export const guideLinks = {
  website: "https://homeoffer365.com",
  team: "/photographers/team",
  stories: "/photographers/homeowner-stories",
  reviews: null as string | null,
  walkthrough: "/videos/mt-vernon-walkthrough.mp4",
  upload: "/photographers/upload",
  support: null as string | null,
};

export const walkthroughSample = {
  src: guideLinks.walkthrough,
  poster: "/images/photo-examples/video-poster.jpg",
  description: "A complete property walkthrough example showing the pacing, camera movement, and room-to-room coverage expected for a Home Offer 365 visit.",
};

export const exteriorExamples = [
  {
    src: "/images/photo-examples/equity-drive/1.jpg",
    label: "Front elevation",
    alt: "Front elevation of a single-story home showing the entrance, windows, roofline, and front yard",
    note: "Start with a centered view showing the full front elevation, entrance, roofline, and surrounding yard.",
  },
  {
    src: "/images/photo-examples/equity-drive/17.jpg",
    label: "Side elevation",
    alt: "Side elevation of the home showing exterior walls, windows, foundation edge, and yard",
    note: "Capture each side separately and keep the complete elevation visible, including the roofline, foundation edge, and access area.",
  },
  {
    src: "/images/photo-examples/equity-drive/20.jpg",
    label: "Rear angle",
    alt: "Wide rear angle showing the back of the home, roofline, windows, and surrounding lot",
    note: "Use a wide rear view to show the entire structure and how it sits on the lot. Add separate closer photos for visible issues.",
  },
  {
    src: "/images/photo-examples/equity-drive/21.jpg",
    label: "Rear / property edge",
    alt: "Rear elevation and property edge showing exterior walls, windows, fence, trees, and yard",
    note: "Include the rear elevation, yard boundaries, fencing, and nearby features so the property condition is visible in context.",
  },
] as const;

export const interiorExamples = [
  {
    src: "/images/photo-examples/equity-drive/2.jpg",
    label: "Living room",
    alt: "Wide living-room view showing seating, windows, flooring, and connected doorways",
    note: "Stand in a corner and show the complete room, including windows, flooring, ceiling, and how it connects to adjacent spaces.",
  },
  {
    src: "/images/photo-examples/equity-drive/6.jpg",
    label: "Kitchen",
    alt: "Wide kitchen view showing cabinets, counters, sink, appliances, window, and doorway",
    note: "Capture the full kitchen layout and all visible cabinets, counters, appliances, plumbing fixtures, and access points.",
  },
  {
    src: "/images/photo-examples/equity-drive/10.jpg",
    label: "Bedroom",
    alt: "Bedroom view showing the bed, walls, window, closet doors, flooring, and ceiling fan",
    note: "Use a wide corner view that shows every wall, the window, closet, flooring, ceiling, and overall room condition.",
  },
  {
    src: "/images/photo-examples/equity-drive/13.jpg",
    label: "Bathroom",
    alt: "Bathroom view showing the vanity, toilet, shower edge, mirror, window, and flooring",
    note: "Show the full bathroom and follow with detail photos of fixtures, plumbing, cabinets, and visible moisture or damage.",
  },
] as const;

export const mechanicalExamples = [
  {
    src: "/images/photo-examples/equity-drive/19.jpg",
    label: "Exterior HVAC",
    alt: "Exterior HVAC equipment beside the home with the surrounding wall and yard visible",
    note: "Take a context photo showing where the exterior equipment is located, followed by closer views and a readable equipment label.",
  },
  {
    src: "/images/photo-examples/equity-drive/14.jpg",
    label: "Water heater",
    alt: "Water heater installed in a utility area beside kitchen cabinetry",
    note: "Capture the water heater in context, then photograph its connections, venting, visible condition, and data label clearly.",
  },
] as const;

export const conditionExamples = [
  {
    src: "/images/photo-examples/equity-drive/18.jpg",
    label: "Overall exterior",
    alt: "Wide property view showing the home, front yard, walkway, trees, and surrounding site",
    note: "Begin with a wide property view that shows the structure, site, access, and overall exterior condition in context.",
  },
  {
    src: "/images/photo-examples/equity-drive/11.jpg",
    label: "Interior surfaces",
    alt: "Empty bedroom showing walls, windows, flooring, baseboards, ceiling, and electrical outlets",
    note: "Use clear room views to document walls, ceilings, flooring, trim, windows, and any visible damage or unfinished work.",
  },
  {
    src: "/images/photo-examples/equity-drive/13.jpg",
    label: "Bathroom condition",
    alt: "Bathroom showing fixtures, walls, window, vanity, mirror, and flooring",
    note: "Document fixture and surface condition, then add close-ups of visible staining, leaks, damage, or needed repairs.",
  },
  {
    src: "/images/photo-examples/equity-drive/20.jpg",
    label: "Rear site condition",
    alt: "Rear property view showing the home, yard, trees, grading, and nearby structures",
    note: "Show the rear structure and site together so grading, vegetation, access, and visible exterior condition can be reviewed.",
  },
] as const;

export const photoCategories = [
  {
    id: "exterior", title: "Exterior Photos", number: "01", icon: "house",
    image: "/images/photo-examples/equity-drive/1.jpg",
    alt: "Front elevation of a single-story home showing the entrance, windows, roofline, and front yard",
    highlights: ["Front, rear & both sides", "Yard, driveway & outbuildings"],
    shots: ["Front of house", "Rear of house", "Both sides", "Roof and gutters", "Driveway, yard, and outbuildings", "Visible exterior damage"],
    tip: "Take a wide view first, then closer photos of visible damage. Photograph the roof from a safe, accessible location.",
    exampleNote: "Show the building and surrounding features in context, then capture the rear and both sides separately.",
  },
  {
    id: "interior", title: "Interior Photos", number: "02", icon: "sofa",
    image: "/images/photo-examples/equity-drive/2.jpg",
    alt: "Wide living-room view showing seating, windows, flooring, and connected doorways",
    highlights: ["Every accessible room", "Layout, condition & key details"],
    shots: ["Living room", "Kitchen and appliances", "All bedrooms", "All bathrooms", "Basement and attic where accessible", "Floors, ceilings, and walls", "Visible damage or needed repairs"],
    tip: "Use well-lit views showing how rooms connect. Include both an overall view and details of visible issues.",
    exampleNote: "Show how rooms connect, then photograph each room individually. Include floors, ceilings, walls, appliances, and visible repairs.",
  },
  {
    id: "mechanical", title: "Mechanical Systems", number: "03", icon: "settings", image: "/images/photo-examples/equity-drive/14.jpg", alt: "Water heater installed in a utility area beside kitchen cabinetry",
    highlights: ["HVAC, water heater & panel", "Equipment labels & condition"],
    shots: ["HVAC equipment", "Furnace and air conditioning", "Water heater", "Electrical panel where safely accessible", "Visible plumbing", "Equipment labels and visible condition"],
    tip: "Include readable labels when accessible. Do not open electrical equipment or remove covers to obtain a photo.",
    exampleNote: "Capture an overview of each system and separate readable label photos where safely accessible. Do not open electrical equipment or remove covers.",
  },
  {
    id: "condition", title: "Property Condition", number: "04", icon: "scan", image: "/images/photo-examples/equity-drive/18.jpg", alt: "Wide property view showing the home, front yard, walkway, trees, and surrounding site",
    highlights: ["Overall property condition", "Damage, moisture & repairs"],
    shots: ["Water damage", "Foundation cracks", "Roof leaks", "Mold-like staining", "Fire damage", "Structural concerns", "Unfinished renovations"],
    tip: "Show the issue in context, then capture a closer view. Describe what is visible rather than diagnosing its cause.",
    exampleNote: "Start with a wide property view, then document visible cracks, staining, damage, or unfinished work with a closer detail. Report what you see without diagnosing the cause.",
  },
] as const;

export const checklistGroups = [
  { title: "Exterior", items: ["Front, rear, and both sides photographed", "Roof, yard, driveway, and outbuildings documented", "Exterior damage photographed"] },
  { title: "Interior", items: ["Every accessible room photographed", "Kitchen and bathrooms documented", "Basement, attic, and garage photographed where accessible", "Interior damage documented"] },
  { title: "Mechanical", items: ["HVAC system photographed", "Water heater photographed", "Electrical panel photographed where safely accessible", "Visible plumbing and mechanical issues documented"] },
  { title: "Video", items: ["Full walkthrough recorded", "All accessible rooms included", "Major condition issues shown"] },
  { title: "Final submission", items: ["Photos are clear and properly lit", "Property address confirmed", "All required files uploaded", "Missing or inaccessible areas reported", "Assignment ready for submission"] },
] as const;
