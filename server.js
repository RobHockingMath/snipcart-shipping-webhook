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
// (No changes to your arrays)

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

// Korea (KR) - fast array covers up to 30 kg, slow array is shorter
const KR_fast = [
  450, 450, 530, 610, 690, 770, 850, 920, 990, 1060,
  1130, 1200, 1270, 1340, 1410, 1480, 1550, 1620, 1690, 1760,
  1830, 1890, 1950, 2010, 2070, 2130, 2190, 2250, 2310, 2370,
  2430, 2490, 2550, 2610, 2670, 2730, 2790, 2850, 2910, 2970,
  3030, 3080, 3130, 3180, 3230, 3280, 3330, 3380, 3430, 3480,
  3530, 3580, 3630, 3680, 3730, 3780, 3830, 3880, 3930, 3980,
  4030
];
const KR_slow = [
  220, 220, 260, 300, 340, 380, 420, 460, 500, 540,
  580, 620, 660, 700, 740, 780, 820, 860, 900, 940,
  980, 1020, 1060, 1100, 1140, 1180, 1220, 1260, 1300, 1340,
  1380, 1420, 1460, 1500, 1540, 1580, 1620, 1660, 1700, 1740,
  1780
];

// Japan (JP)
const JP_fast = [
  450, 450, 530, 610, 690, 770, 850, 920, 990, 1060,
  1130, 1200, 1270, 1340, 1410, 1480, 1550, 1620, 1690, 1760,
  1830, 1890, 1950, 2010, 2070, 2130, 2190, 2250, 2310, 2370,
  2430, 2490, 2550, 2610, 2670, 2730, 2790, 2850, 2910, 2970,
  3030, 3080, 3130, 3180, 3230, 3280, 3330, 3380, 3430, 3480,
  3530, 3580, 3630, 3680, 3730, 3780, 3830, 3880, 3930, 3980,
  4030
];
const JP_slow = [
  425, 425, 480, 535, 590, 645, 700, 755, 810, 865,
  920, 975, 1030, 1085, 1140, 1195, 1250, 1305, 1360, 1415,
  1470, 1525, 1580, 1635, 1690, 1745, 1800, 1855, 1910, 1965,
  2020, 2075, 2130, 2185, 2240, 2295, 2350, 2405, 2460, 2515,
  2570, 2625, 2680, 2735, 2790, 2845, 2900, 2955, 3010, 3065,
  3120, 3175, 3230, 3285, 3340, 3395, 3450, 3505, 3560, 3615,
  3670
];

// United States (US)
const US_fast = [
  850, 850, 1200, 1310, 1420, 1530, 1640, 1750, 1860, 1970,
  2080, 2190, 2300, 2410, 2520, 2630, 2740, 2850, 2960, 3070,
  3180, 3290, 3400, 3510, 3620, 3730, 3840, 3950, 4060, 4170,
  4280, 4390, 4500, 4610, 4720, 4830, 4940, 5050, 5160, 5270,
  5380, 5490, 5600, 5710, 5820, 5930, 6040, 6150, 6260, 6370,
  6480, 6590, 6700, 6810, 6920, 7030, 7140, 7250, 7360, 7470,
  7580
];
const US_slow = [
  500, 500, 605, 710, 815, 920, 1025, 1130, 1235, 1340,
  1445, 1550, 1655, 1760, 1865, 1970, 2075, 2180, 2285, 2390,
  2495, 2600, 2705, 2810, 2915, 3020, 3125, 3230, 3335, 3440,
  3545, 3650, 3755, 3860, 3965, 4070, 4175, 4280, 4385, 4490,
  4595, 4700, 4805, 4910, 5015, 5120, 5225, 5330, 5435, 5540,
  5645, 5750, 5855, 5960, 6065, 6170, 6275, 6380, 6485, 6590,
  6695
];

// Canada (CA)
const CA_fast = [
  720, 720, 820, 930, 1040, 1150, 1260, 1390, 1520, 1650,
  1780, 1910, 2040, 2170, 2300, 2430, 2560, 2690, 2820, 2950,
  3080, 3190, 3300, 3410, 3520, 3630, 3740, 3850, 3960, 4070,
  4180, 4290, 4400, 4510, 4620, 4730, 4840, 4950, 5060, 5170,
  5280, 5370, 5460, 5550, 5640, 5730, 5820, 5910, 6000, 6090,
  6180, 6270, 6360, 6450, 6540, 6630, 6720, 6810, 6900, 6990,
  7080
];
const CA_slow = [
  230, 230, 385, 540, 695, 850, 1005, 1160, 1315, 1470,
  1625, 1780, 1935, 2090, 2245, 2400, 2555, 2710, 2865, 3020,
  3175, 3330, 3485, 3640, 3795, 3950, 4105, 4260, 4415, 4570,
  4725, 4880, 5035, 5190, 5345, 5500, 5655, 5810, 5965, 6120,
  6275, 6430, 6585, 6740, 6895, 7050, 7205, 7360, 7515, 7670,
  7825, 7980, 8135, 8290, 8445, 8600, 8755, 8910, 9065, 9220,
  9375
];

// United Kingdom (GB)
const GB_fast = [
  730, 730, 880, 1030, 1130, 1200, 1260, 1390, 1520, 1650,
  1780, 1910, 2040, 2170, 2300, 3430, 2560, 2690, 2820, 2950,
  3080, 3190, 3300, 3410, 3520, 3630, 3740, 3850, 3960, 4070,
  4180, 4290, 4400, 4510, 4620, 4730, 4840, 4950, 5060, 5170,
  5280, 5370, 5460, 5550, 5640, 5730, 5820, 5910, 6000, 6090,
  6180, 6270, 6360, 6450, 6540, 6630, 6720, 6810, 6900, 6990,
  7080
];
const GB_slow = [
  380, 380, 495, 610, 725, 840, 955, 1070, 1185, 1300,
  1415, 1530, 1645, 1760, 1875, 1990, 2105, 2220, 2335, 2450,
  2565, 2680, 2795, 2910, 3025, 3140, 3255, 3370, 3485, 3600,
  3715, 3830, 3945, 4060, 4175, 4290, 4405, 4520, 4635, 4750,
  4865, 4980, 5095, 5210, 5325, 5440, 5555, 5670, 5785, 5900,
  6015, 6130, 6245, 6360, 6475, 6590, 6705, 6820, 6935, 7050,
  7165
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
          ? { min: method === "fast" ? 2 : 7, max: method === "fast" ? 3 : 10 }
          : country === "JP"
          ? { min: method === "fast" ? 2 : 7, max: method === "fast" ? 3 : 10 }
          : country === "US"
          ? { min: method === "fast" ? 4 : 10, max: method === "fast" ? 5 : 14 }
          : country === "CA"
          ? { min: method === "fast" ? 4 : 14, max: method === "fast" ? 5 : 18 }
          : country === "GB"
          ? { min: method === "fast" ? 4 : 13, max: method === "fast" ? 5 : 16 }
          : { min: 0, max: 0 }
        )
      };
    });
  }
}

// --- Currency conversion rates (from TWD) ---
const conversionRates = {
  // CHANGED: Use "TWD": 1 if your base is TWD.
  // If Snipcart actually sends "NTD", keep it as "NTD": 1
  "TWD": 1,
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

  // Sums up item.weight (already in kg)
  const totalWeightKg = items.reduce((sum, item) => sum + (item.weight || 0), 0);

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

  // We'll collect whichever shipping methods are available
  // => Only shipping cost is converted, item prices not touched
  const convRate = conversionRates[currency] || 1;
  let rates = [];

  // Try FAST shipping
  const fastData = getShippingData(countryCode, "fast", selectedWeight);
  if (fastData) {
    // Convert from TWD to chosen currency
    const fastCost = (fastData.cost * convRate).toFixed(2);
    rates.push({
      cost: fastCost,
      description: `Fast Shipping (${fastData.delay.min}-${fastData.delay.max} days)`,
      delay: { minimum: fastData.delay.min, maximum: fastData.delay.max }
    });
  }

  // Try SLOW shipping
  const slowData = getShippingData(countryCode, "slow", selectedWeight);
  if (slowData) {
    const slowCost = (slowData.cost * convRate).toFixed(2);
    rates.push({
      cost: slowCost,
      description: `Slow Shipping (${slowData.delay.min}-${slowData.delay.max} days)`,
      delay: { minimum: slowData.delay.min, maximum: slowData.delay.max }
    });
  }

  // If no methods are available, respond with 400
  if (rates.length === 0) {
    return res
      .status(400)
      .json({ rates: [], error: "No shipping methods available for this weight" });
  }

  // Otherwise, return all available methods
  return res.json({ rates });
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send("Shipping webhook is live!");
});

app.listen(PORT, () => console.log(`Shipping webhook running on port ${PORT}`));
