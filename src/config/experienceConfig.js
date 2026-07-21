export const experiences = [
  {
    order: "001",
    slug: "flower",
    name: "Flower",
    load: () =>
      import("../../world/flowerWorld/FlowerExperience").then((m) => m.FlowerExperience),
  },
  {
    order: "002",
    slug: "rects",
    name: "Ryoji",
    load: () => import("../../world/rectPerception/RectExperience").then((m) => m.RectExperience),
  },
  {
    order: "003",
    slug: "animalPage",
    name: "Models",
    load: () =>
      import("../../world/animalWorld/ModelExperience").then((m) => m.ModelExperience),
  },
  {
    order: "004",
    slug: "pointCloud",
    name: "Points",
    canvasClassName: "bg-[#798086]",
    load: () =>
      import("../../world/pointCloudWorld/PointExperience").then((m) => m.PointExperience),
  },
  {
    order: "005",
    slug: "shaders",
    name: "Shaders",
    custom: "shader",
  },
  {
    order: "006",
    slug: "sineWave",
    name: "Sines",
    load: () => import("../../world/sineWorld/SineExperience").then((m) => m.SineExperience),
  },
  {
    order: "007",
    slug: "portalblend",
    name: "Portal",
    load: () =>
      import("../../world/portalWorld/PortalExperience").then((m) => m.PortalExperience),
  },
  {
    order: "008",
    slug: "ascii",
    name: "Ascii",
    load: () => import("../../world/asciiWorld/AsciiExperience").then((m) => m.AsciiExperience),
  },
  {
    order: "009",
    slug: "forest",
    name: "Forest",
    load: () => import("../../world/forestWorld/ForestExperience").then((m) => m.ForestExperience),
  },
];

export const experienceBySlug = Object.fromEntries(
  experiences.map((e) => [e.slug, e])
);
