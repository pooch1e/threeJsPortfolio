export const experiences = [
  {
    order: "001",
    slug: "animalPage",
    name: "Models",
    load: () =>
      import("../../world/animalWorld/ModelExperience").then((m) => m.ModelExperience),
  },
  {
    order: "002",
    slug: "pointCloud",
    name: "Points",
    canvasClassName: "bg-[#798086]",
    load: () =>
      import("../../world/pointCloudWorld/PointExperience").then((m) => m.PointExperience),
  },
  {
    order: "003",
    slug: "shaders",
    name: "Shaders",
    custom: "shader",
  },
  {
    order: "004",
    slug: "sineWave",
    name: "Sines",
    load: () => import("../../world/sineWorld/SineExperience").then((m) => m.SineExperience),
  },
  {
    order: "005",
    slug: "portalblend",
    name: "Portal",
    load: () =>
      import("../../world/portalWorld/PortalExperience").then((m) => m.PortalExperience),
  },
  {
    order: "006",
    slug: "ascii",
    name: "Ascii",
    load: () => import("../../world/asciiWorld/AsciiExperience").then((m) => m.AsciiExperience),
  },
  {
    order: "007",
    slug: "flower",
    name: "Flower",
    load: () =>
      import("../../world/flowerWorld/FlowerExperience").then((m) => m.FlowerExperience),
  },
  {
    order: "008",
    slug: "rects",
    name: "Ryoji",
    load: () => import("../../world/rectPerception/RectExperience").then((m) => m.RectExperience),
  },
];

export const experienceBySlug = Object.fromEntries(
  experiences.map((e) => [e.slug, e])
);
