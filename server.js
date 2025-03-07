const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Allowed weights (in kg): first two are 0.25 and 0.5, then every 0.5 kg from 1.0 to 30.0.
const allowedWeights = [0.25, 0.5];
for (let w = 1.0; w <= 30; w += 0.5) {
  allowedWeights.push(parseFloat(w.toFixed(2)));
}
allowedWeights.sort((a, b) => a - b); // This array now has 61 values

// --- Explicit cost arrays for each country and method ---
// Each array must have 61 numbers corresponding to the allowed weights.

// Taiwan (TW)
const TW_fast = [
  120, 210, 300, 390, 480, 570, 660, 750, 840, 930,
  1020, 1110, 1200, 1290, 1380, 1470, 1560, 1650, 1740, 1830,
  1920, 2010, 2100, 2190, 2280, 2370, 2460, 2550, 2640, 2730,
  2820, 2910, 3000, 3090, 3180, 3270, 3360, 3450, 3540, 3630,
  3720, 3810, 3900, 3990, 4080, 4170, 4260, 4350, 4440, 4530,
  4620, 4710, 4800, 4890, 4980, 5070, 5160, 5250, 5340, 5430,
  5520
];
const TW_slow = [
  60, 105, 150, 195, 240, 285, 330, 375, 420, 465,
  510, 555, 600, 645, 690, 735, 780, 825, 870, 915,
  960, 1005, 1050, 1095, 1140, 1185, 1230, 1275, 1320, 1365,
  1410, 1455, 1500, 1545, 1590, 1635, 1680, 1725, 1770, 1815,
  1860, 1905, 1950, 1995, 2040, 2085, 2130, 2175, 2220, 2265,
  2310, 2355, 2400, 2445, 2490, 2535, 2580, 2625, 2670, 2715,
  2760
];

// Hong Kong (HK)
const HK_fast = [
  450, 450, 500, 550, 600, 650, 700, 760, 820, 880,
  940, 1000, 1060, 1120, 1180, 1240, 1300, 1360, 1420, 1480,
  1540, 1590, 1640, 1690, 1740, 1790, 1840, 1890, 1940, 1990,
  2040, 2090, 2140, 2190, 2240, 2290, 2340, 2390, 2440, 2490,
  2540, 2580, 2620, 2660, 2700, 2740, 2780, 2820, 2860, 2900,
  2940, 2980, 3020, 3060, 3100, 3140, 3180, 3220, 3260, 3300,
  3340
];
const HK_slow = [
  240, 240, 275, 310, 345, 380, 415, 450, 485, 520,
  555, 590, 625, 660, 695, 730, 765, 800, 835, 870,
  905, 940, 975, 1010, 1045, 1080, 1115, 1150, 1185, 1220,
  1255, 1290, 1325, 1360, 1395, 1430, 1465, 1500, 1535, 1570,
  1605, 1640, 1675, 1710, 1745, 1780, 1815, 1850, 1885, 1920,
  1955, 1990, 2025, 2060, 2095, 2130, 2165, 2200, 2235, 2270,
  2305
];

// Singapore (SG)
const SG_fast = [
  580, 580, 630, 680, 730, 790, 850, 920, 990, 1060,
  1130, 1200, 1270, 1340, 1410, 1480, 1550, 1620, 1690, 1760,
  1830, 1890, 1950, 2010, 2070, 2130, 2190, 2250, 2310, 2370,
  2430, 2490, 2550, 2610, 2670, 2730, 2790, 2850, 2910, 2970,
  3030, 3080, 3130, 3180, 3230, 3280, 3330, 3380, 3430, 3480,
  3530, 3580, 3630, 3680, 3730, 3780, 3830, 3880, 3930, 3980,
  4030
];
const SG_slow = [
  220, 220, 275, 330, 385, 440, 495, 550, 605, 660,
  715, 770, 825, 880, 935, 990, 1045, 1100, 1155, 1210,
  1265, 1320, 1375, 1430, 1485, 1540, 1595, 1650, 1705, 1760,
  1815, 1870, 1925, 1980, 2035, 2090, 2145, 2200, 2255, 2310,
  3365, 2420, 2475, 2530, 3585, 2640, 2695, 2750, 2805, 2860,
  2915, 2970, 3025, 3080, 3135, 3190, 3245, 3300, 3355, 3410,
  3465
];

// Korea (KR)
const KR_fast = [
  900, 1080, 1260, 1440, 1620, 1800, 1980, 2160, 2340, 2520,
  2700, 2880, 3060, 3240, 3420, 3600, 3780, 3960, 4140, 4320,
  4500, 4680, 4860, 5040, 5220, 5400, 5580, 5760, 5940, 6120,
  6300, 6480, 6660, 6840, 7020, 7200, 7380, 7560, 7740, 7920,
  8100, 8280, 8460, 8640, 8820, 9000, 9180, 9360, 9540, 9720,
  9900, 10080, 10260, 10440, 10620, 10800, 10980, 11160, 11340, 11520,
  11700
];
const KR_slow = [
  450, 540, 630, 720, 810, 900, 990, 1080, 1170, 1260,
  1350, 1440, 1530, 1620, 1710, 1800, 1890, 1980, 2070, 2160,
  2250, 2340, 2430, 2520, 2610, 2700, 2790, 2880, 2970, 3060,
  3150, 3240, 3330, 3420, 3510, 3600, 3690, 3780, 3870, 3960,
  4050, 4140, 4230, 4320, 4410, 4500, 4590, 4680, 4770, 4860,
  4950, 5040, 5130, 5220, 5310, 5400, 5490, 5580, 5670, 5760,
  5850
];

// Japan (JP)
const JP_fast = [
  1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800,
  3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400, 4600, 4800,
  5000, 5200, 5400, 5600, 5800, 6000, 6200, 6400, 6600, 6800,
  7000, 7200, 7400, 7600, 7800, 8000, 8200, 8400, 8600, 8800,
  9000, 9200, 9400, 9600, 9800, 10000, 10200, 10400, 10600, 10800,
  11000, 11200, 11400, 11600, 11800, 12000, 12200, 12400, 12600, 12800,
  13000
];
const JP_slow = [
  500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
  1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400,
  2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400,
  3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400,
  4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300, 5400,
  5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400,
  6500
];

// United States (US)
const US_fast = [
  1100, 1320, 1540, 1760, 1980, 2200, 2420, 2640, 2860, 3080,
  3300, 3520, 3740, 3960, 4180, 4400, 4620, 4840, 5060, 5280,
  5500, 5720, 5940, 6160, 6380, 6600, 6820, 7040, 7260, 7480,
  7700, 7920, 8140, 8360, 8580, 8800, 9020, 9240, 9460, 9680,
  9900, 10120, 10340, 10560, 10780, 11000, 11220, 11440, 11660, 11880,
  12100, 12320, 12540, 12760, 12980, 13200, 13420, 13640, 13860, 14080,
  14300
];
const US_slow = [
  550, 660, 770, 880, 990, 1100, 1210, 1320, 1430, 1540,
  1650, 1760, 1870, 1980, 2090, 2200, 2310, 2420, 2530, 2640,
  2750, 2860, 2970, 3080, 3190, 3300, 3410, 3520, 3630, 3740,
  3850, 3960, 4070, 4180, 4290, 4400, 4510, 4620, 4730, 4840,
  4950, 5060, 5170, 5280, 5390, 5500, 5610, 5720, 5830, 5940,
  6050, 6160, 6270, 6380, 6490, 6600, 6710, 6820, 6930, 7040,
  7150
];

// Canada (CA)
const CA_fast = [
  1150, 1380, 1610, 1840, 2070, 2300, 2530, 2760, 2990, 3220,
  3450, 3680, 3910, 4140, 4370, 4600, 4830, 5060, 5290, 5520,
  5750, 5980, 6210, 6440, 6670, 6900, 7130, 7360, 7590, 7820,
  8050, 8280, 8510, 8740, 8970, 9200, 9430, 9660, 9890, 10120,
  10350, 10580, 10810, 11040, 11270, 11500, 11730, 11960, 12190, 12420,
  12650, 12880, 13110, 13340, 13570, 13800, 14030, 14260, 14490, 14720,
  14950
];
const CA_slow = [
  575, 690, 805, 920, 1035, 1150, 1265, 1380, 1495, 1610,
  1725, 1840, 1955, 2070, 2185, 2300, 2415, 2530, 2645, 2760,
  2875, 2990, 3105, 3220, 3335, 3450, 3565, 3680, 3795, 3910,
  4025, 4140, 4255, 4370, 4485, 4600, 4715, 4830, 4945, 5060,
  5175, 5290, 5405, 5520, 5635, 5750, 5865, 5980, 6095, 6210,
  6325, 6440, 6555, 6670, 6785, 6900, 7015, 7130, 7245, 7360,
  7475
];

// United Kingdom (GB)
const GB_fast = [
  1050, 1260, 1470, 1680, 1890, 2100, 2310, 2520, 2730, 2940,
  3150, 3360, 3570, 3780, 3990, 4200, 4410, 4620, 4830, 5040,
  5250, 5460, 5670, 5880, 6090, 6300, 6510, 6720, 6930, 7140,
  7350, 7560, 7770, 7980, 8190, 8400, 8610, 8820, 9030, 9240,
  9450, 9660, 9870, 10080, 10290, 10500, 10710, 10920, 11130, 11340,
  11550, 11760, 11970, 12180, 12390, 12600, 12810, 13020, 13230, 13440,
  13650
];
const GB_slow = [
  525, 630, 735, 840, 945, 1050, 1155, 1260, 1365, 1470,
  1575, 1680, 1785, 1890, 1995, 2100, 2205, 2310, 2415, 2520,
  2625, 2730, 2835, 2940, 3045, 3150, 3255, 3360, 3465, 3570,
  3675, 3780, 3885, 3990, 4095, 4200, 4305, 4410, 4515, 4620,
  4725, 4830, 4935, 5040, 5145, 5250, 5355, 5460, 5565, 5670,
  5775, 5880, 5985, 6090, 6195, 6300, 6405, 6510, 6615, 6720,
  6825
];

// --- Build the shipping data dictionary ---
let shippingRates = {};

for (const country of ["TW", "HK", "SG", "KR", "JP", "US", "CA", "GB"]) {
  shippingRates[country] = {};
  for (const method of ["fast", "slow"]) {
    shippingRates[country][method] = {};
    let costArray;
    if (country === "TW") {
      costArray = method === "fast" ? TW_fast : TW_slow;
    } else if (country === "HK") {
      costArray = method === "fast" ? HK_fast : HK_slow;
    } else if (country === "SG") {
      costArray = method === "fast" ? SG_fast : SG_slow;
    } else if (country === "KR") {
      costArray = method === "fast" ? KR_fast : KR_slow;
    } else if (country === "JP") {
      costArray = method === "fast" ? JP_fast : JP_slow;
    } else if (country === "US") {
      costArray = method === "fast" ? US_fast : US_slow;
    } else if (country === "CA") {
      costArray = method === "fast" ? CA_fast : CA_slow;
    } else if (country === "GB") {
      costArray = method === "fast" ? GB_fast : GB_slow;
    }
    // Assume that costArray has 61 numbers corresponding to allowedWeights.
    allowedWeights.forEach((w, i) => {
      shippingRates[country][method][w.toFixed(2)] = {
        cost: costArray[i],
        // For this example, use constant delay values (dummy data)
        delay: (country === "TW"
          ? { min: method === "fast" ? 1 : 3, max: method === "fast" ? 1 : 3 }
          : country === "HK"
          ? { min: method === "fast" ? 1 : 7, max: method === "fast" ? 2 : 10 }
          : country === "SG"
          ? { min: method === "fast" ? 2 : 8, max: method === "fast" ? 3 : 10 }
          : country === "KR"
          ? { min: method === "fast" ? 4 : 7, max: method === "fast" ? 4 : 7 }
          : country === "JP"
          ? { min: method === "fast" ? 3 : 5, max: method === "fast" ? 3 : 5 }
          : country === "US"
          ? { min: method === "fast" ? 5 : 8, max: method === "fast" ? 5 : 8 }
          : country === "CA"
          ? { min: method === "fast" ? 6 : 10, max: method === "fast" ? 6 : 10 }
          : country === "GB"
          ? { min: method === "fast" ? 4 : 7, max: method === "fast" ? 4 : 7 }
          : { min: 0, max: 0 }
        )
      };
    });
  }
}

// --- Currency conversion rates (from NTD) ---
const conversionRates = {
  "NTD": 1,
  "HKD": 0.25,
  "SGD": 0.045,
  "JPY": 4.5,
  "KRW": 42,
  "GBP": 0.025,
  "USD": 0.03,
  "CAD": 0.04
};

// Helper: look up shipping data given country, method, and weight threshold.
function getShippingData(country, method, weight) {
  const weightStr = weight.toFixed(2);
  return (
    shippingRates[country] &&
    shippingRates[country][method] &&
    shippingRates[country][method][weightStr]
  );
}

// --- Webhook endpoint (single definition) ---
app.post("/shippingrates", (req, res) => {
  console.log("Request received:", JSON.stringify(req.body, null, 2));

  // Snipcart typically sends data under req.body.content
  // If content doesn't exist (e.g., local tests), fallback to req.body
  const { currency, items, shippingAddress } = req.body.content || req.body;

  if (!shippingAddress || !shippingAddress.country) {
    return res.status(400).json({ rates: [], error: "Missing shipping country" });
  }

  const countryCode = shippingAddress.country.toUpperCase();
  if (!shippingRates[countryCode]) {
    return res.status(400).json({ rates: [], error: "We do not ship to this country" });
  }

  // Sum the total weight (assumed in grams) and convert to kg.
  let totalWeightGrams = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalWeightKg = totalWeightGrams / 1000;

  // Find the smallest allowed weight that is >= totalWeightKg.
  let selectedWeight = null;
  for (let w of allowedWeights) {
    if (w >= totalWeightKg) {
      selectedWeight = w;
      break;
    }
  }
  if (selectedWeight === null) {
    return res
      .status(400)
      .json({ rates: [], error: "Total weight exceeds maximum allowed (30 kg)" });
  }

  // Look up shipping data for both fast and slow methods.
  const fastData = getShippingData(countryCode, "fast", selectedWeight);
  const slowData = getShippingData(countryCode, "slow", selectedWeight);
  if (!fastData || !slowData) {
    return res
      .status(400)
      .json({ rates: [], error: "Shipping data not available for this weight" });
  }

  // Convert cost from NTD to the requested currency.
  const convRate = conversionRates[currency] || 1;
  const fastCost = (fastData.cost * convRate).toFixed(2);
  const slowCost = (slowData.cost * convRate).toFixed(2);

  res.json({
    rates: [
      {
        cost: fastCost,
        description: `Fast Shipping (${fastData.delay.min}-${fastData.delay.max} days)`,
        delay: { minimum: fastData.delay.min, maximum: fastData.delay.max }
      },
      {
        cost: slowCost,
        description: `Slow Shipping (${slowData.delay.min}-${slowData.delay.max} days)`,
        delay: { minimum: slowData.delay.min, maximum: slowData.delay.max }
      }
    ]
  });
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send("Shipping webhook is live!");
});

app.listen(PORT, () => console.log(`Shipping webhook running on port ${PORT}`));
