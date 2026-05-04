import fs from "fs";
import path from "path";
import axios from "axios";

const EPHE_DIR = path.join(process.cwd(), "ephe");
const BASE_URL = "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/";

// Essential files for 1800-2400 AD precision
const FILES = [
  "seas_18.se1", // Asteroids
  "sepl_18.se1", // Planets
  "semo_18.se1", // Moon
];

async function downloadFile(filename: string) {
  const filePath = path.join(EPHE_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`File ${filename} already exists, skipping.`);
    return;
  }

  console.log(`Downloading ${filename}...`);
  const response = await axios({
    method: "get",
    url: `${BASE_URL}${filename}`,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on("finish", () => resolve());
    writer.on("error", reject);
  });
}

async function run() {
  if (!fs.existsSync(EPHE_DIR)) {
    fs.mkdirSync(EPHE_DIR, { recursive: true });
  }

  try {
    for (const file of FILES) {
      await downloadFile(file);
    }
    console.log("All essential ephemeris files downloaded successfully to ./ephe");
  } catch (error: any) {
    console.error("Failed to download ephemeris files:", error.message);
  }
}

run();
