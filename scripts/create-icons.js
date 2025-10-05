const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a simple SVG icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4F46E5"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
    size * 0.6
  }" fill="white" text-anchor="middle" dominant-baseline="middle">✓</text>
</svg>
`;

const sizes = [16, 48, 128];

Promise.all(
  sizes.map(async (size) => {
    const svg = Buffer.from(createSVG(size));
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon${size}.png`));
    console.log(`✓ Created icon${size}.png`);
  })
)
  .then(() => {
    console.log("✅ All icons created successfully!");
  })
  .catch((error) => {
    console.error("Error creating icons:", error);
    process.exit(1);
  });
