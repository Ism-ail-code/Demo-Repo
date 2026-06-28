export interface ColorVariant {
  id: string;
  name: string;
  color: string;
  baseColorFactor: [number, number, number, number];
}

export interface Product {
  id: string;
  name: string;
  merchant: string;
  merchantSlug: string;
  checkoutUrl: string;
  description: string;
  category: string;
  scanCount: number;
  colorVariants: ColorVariant[];
  glbUrl: string;
  usdzUrl: string;
  thumbnailColor: string;
}

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "chair-001",
    name: "Nordic Lounge Chair",
    merchant: "Studio Furniture Co.",
    merchantSlug: "studio-furniture",
    checkoutUrl: "https://example.com/checkout/chair-001",
    description: "Ergonomic solid walnut frame with premium upholstery",
    category: "Furniture",
    scanCount: 2847,
    colorVariants: [
      { id: "slate", name: "Slate", color: "#475569", baseColorFactor: [0.278, 0.337, 0.412, 1.0] },
      { id: "terracotta", name: "Terra", color: "#C2724F", baseColorFactor: [0.76, 0.447, 0.31, 1.0] },
      { id: "sand", name: "Sand", color: "#D4B896", baseColorFactor: [0.831, 0.722, 0.588, 1.0] },
      { id: "forest", name: "Forest", color: "#2D6A4F", baseColorFactor: [0.176, 0.416, 0.31, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
    thumbnailColor: "#C2724F",
  },
  {
    id: "lamp-001",
    name: "Arc Floor Lamp",
    merchant: "Luminos Studio",
    merchantSlug: "luminos",
    checkoutUrl: "https://example.com/checkout/lamp-001",
    description: "Brushed brass arc lamp with linen shade",
    category: "Lighting",
    scanCount: 1534,
    colorVariants: [
      { id: "brass", name: "Brass", color: "#B5860D", baseColorFactor: [0.71, 0.525, 0.051, 1.0] },
      { id: "chrome", name: "Chrome", color: "#A8A9AD", baseColorFactor: [0.659, 0.663, 0.678, 1.0] },
      { id: "matte-black", name: "Matte", color: "#1C1C1E", baseColorFactor: [0.11, 0.11, 0.118, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/RobotExpressive.usdz",
    thumbnailColor: "#B5860D",
  },
  {
    id: "sofa-001",
    name: "Haven Sectional Sofa",
    merchant: "Cloud Living",
    merchantSlug: "cloud-living",
    checkoutUrl: "https://example.com/checkout/sofa-001",
    description: "Deep-seat modular sectional with microsuede finish",
    category: "Furniture",
    scanCount: 4210,
    colorVariants: [
      { id: "oatmeal", name: "Oatmeal", color: "#C8BBA5", baseColorFactor: [0.784, 0.733, 0.647, 1.0] },
      { id: "charcoal", name: "Charcoal", color: "#3D3D3D", baseColorFactor: [0.239, 0.239, 0.239, 1.0] },
      { id: "sage", name: "Sage", color: "#87A68C", baseColorFactor: [0.529, 0.651, 0.549, 1.0] },
      { id: "navy", name: "Navy", color: "#1B2A4A", baseColorFactor: [0.106, 0.165, 0.290, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
    thumbnailColor: "#C8BBA5",
  },
  {
    id: "table-001",
    name: "Hex Dining Table",
    merchant: "Oak & Steel",
    merchantSlug: "oak-steel",
    checkoutUrl: "https://example.com/checkout/table-001",
    description: "Solid white oak table with powder-coated steel legs",
    category: "Furniture",
    scanCount: 978,
    colorVariants: [
      { id: "natural", name: "Natural", color: "#D4A96A", baseColorFactor: [0.831, 0.663, 0.416, 1.0] },
      { id: "walnut", name: "Walnut", color: "#5C3D2E", baseColorFactor: [0.361, 0.239, 0.180, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
    thumbnailColor: "#D4A96A",
  },
  {
    id: "vase-001",
    name: "Sculptural Ceramic Vase",
    merchant: "Clay & Form",
    merchantSlug: "clay-form",
    checkoutUrl: "https://example.com/checkout/vase-001",
    description: "Hand-thrown stoneware with reactive glaze finish",
    category: "Decor",
    scanCount: 3120,
    colorVariants: [
      { id: "ash", name: "Ash", color: "#9E9E9E", baseColorFactor: [0.62, 0.62, 0.62, 1.0] },
      { id: "rust", name: "Rust", color: "#A0522D", baseColorFactor: [0.627, 0.322, 0.176, 1.0] },
      { id: "teal", name: "Teal", color: "#2C7873", baseColorFactor: [0.173, 0.471, 0.451, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
    thumbnailColor: "#2C7873",
  },
  {
    id: "astronaut",
    name: "Astronaut",
    merchant: "AR Playground",
    merchantSlug: "ar-playground",
    checkoutUrl: "https://example.com",
    description: "Sample 3D model for AR playground demo",
    category: "Demo",
    scanCount: 12480,
    colorVariants: [
      { id: "white", name: "White", color: "#F0F0F0", baseColorFactor: [0.941, 0.941, 0.941, 1.0] },
      { id: "gold", name: "Gold", color: "#D4AF37", baseColorFactor: [0.831, 0.686, 0.216, 1.0] },
      { id: "red", name: "Red", color: "#C53030", baseColorFactor: [0.773, 0.188, 0.188, 1.0] },
    ],
    glbUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdzUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
    thumbnailColor: "#F0F0F0",
  },
];

export const PLAYGROUND_PRODUCTS = [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[5]];

export function getProductById(id: string): Product | undefined {
  return SAMPLE_PRODUCTS.find((p) => p.id === id);
}
