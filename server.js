const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * 1) Create our allowedWeights array, from 0.25 up to 30.0
 *    in 0.5 kg increments (plus the 0.25, 0.5 bracket).
 */
const allowedWeights = [0.25, 0.5];
for (let w = 1.0; w <= 30; w += 0.5) {
  allowedWeights.push(parseFloat(w.toFixed(2)));
}
allowedWeights.sort((a, b) => a - b); // Now has 61 values

// ─────────────────────────────────────────────────────────────────────────────
//   :: All shipping cost arrays
// ─────────────────────────────────────────────────────────────────────────────

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

//
// ─────────────────────────────────────────────────────────────────────────────
//   Build the shippingRates dictionary
// ─────────────────────────────────────────────────────────────────────────────
//
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
    allowedWeights.forEach((w, i) => {
      shippingRates[country][method][w.toFixed(2)] = {
        cost: costArray[i] // cost is undefined if i >= costArray.length.
      };
    });
  }
}

//
// ─────────────────────────────────────────────────────────────────────────────
//   Currency conversion rates (TWD base)
// ─────────────────────────────────────────────────────────────────────────────
//
const conversionRates = {
  "twd": 1,
  "hkd": 0.25,
  "sgd": 0.045,
  "jpy": 4.5,
  "krw": 42,
  "gbp": 0.025,
  "usd": 0.03,
  "cad": 0.04
};

/**
 * Given a (country, method) and a totalWeightKg, this function returns the cost for the
 * first allowed bracket (from the cost array) that is greater than or equal to totalWeightKg.
 * If totalWeightKg exceeds the maximum weight for which a cost is defined, it returns null.
 */
function findBracketCost(country, method, totalWeightKg) {
  if (!shippingRates[country] || !shippingRates[country][method]) {
    return null;
  }
  const costMap = shippingRates[country][method];

  // Build an array of valid weights for which a cost is defined.
  const validWeights = allowedWeights.filter(w => {
    const wStr = w.toFixed(2);
    return costMap[wStr] && costMap[wStr].cost !== undefined;
  });

  if (validWeights.length === 0) return null;

  // The maximum allowed weight is the highest valid weight.
  const maxWeightPossible = validWeights[validWeights.length - 1];
  if (totalWeightKg > maxWeightPossible) {
    return null; // Order too heavy for this shipping method.
  }

  // Find the smallest valid weight bracket that is >= totalWeightKg.
  for (let w of validWeights) {
    if (w >= totalWeightKg) {
      return costMap[w.toFixed(2)].cost;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//   Shipping webhook endpoint (Snipcart v3)
//   (Changed route to "/shipping_rates" with underscore.)
// ─────────────────────────────────────────────────────────────────────────────
app.post("/shipping_rates", (req, res) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    const { currency, items, shippingAddress } = req.body.content || req.body;

    // 1) Check for missing shipping country.
    if (!shippingAddress || !shippingAddress.country) {
      return res.status(200).json({
        rates: [],
        errors: [{
          key: "noCountry",
          message: "Missing shipping country.",
          preventCheckout: true
        }]
      });
    }

    const countryCode = shippingAddress.country.toUpperCase();
    if (!shippingRates[countryCode]) {
      return res.status(200).json({
        rates: [],
        errors: [{
          key: "unsupportedCountry",
          message: "We do not ship to this country.",
          preventCheckout: true
        }]
      });
    }

    // 2) Check that there are items.
    if (!items || items.length === 0) {
      return res.status(200).json({
        rates: [],
        errors: [{
          key: "noItems",
          message: "No items in the order.",
          preventCheckout: true
        }]
      });
    }

    // 3) Sum up item weights (in kg), factoring in quantity.
    const totalWeightKg = items.reduce((sum, item) => {
      const w = parseFloat(item.weight) || 0;
      const qty = parseFloat(item.quantity) || 1;
      return sum + w * qty;
    }, 0);
    console.log(`Total weight: ${totalWeightKg} kg`);

    const userCurrency = (currency || "").toLowerCase();
    const convRate = conversionRates[userCurrency] || 1;
    console.log(`Snipcart currency: ${currency}, convRate: ${convRate}`);

    let rates = [];

    // 4) Try fast shipping.
    const fastCostRaw = findBracketCost(countryCode, "fast", totalWeightKg);
    if (fastCostRaw !== null) {
      const costConverted = (fastCostRaw * convRate).toFixed(2);
      rates.push({
        cost: costConverted,
        description: "Fast Shipping",
        delay: { minimum: 2, maximum: 5 }
      });
    }

    // 5) Try slow shipping.
    const slowCostRaw = findBracketCost(countryCode, "slow", totalWeightKg);
    if (slowCostRaw !== null) {
      const costConverted = (slowCostRaw * convRate).toFixed(2);
      rates.push({
        cost: costConverted,
        description: "Slow Shipping",
        delay: { minimum: 7, maximum: 14 }
      });
    }

    // 6) If no shipping methods are available, return an error response.
    if (rates.length === 0) {
      return res.status(200).json({
        rates: [],
        errors: [{
          key: "noMethodsOrOverweight",
          message: "No shipping method can handle that weight for this destination.",
          preventCheckout: true
        }]
      });
    }

    // 7) Otherwise, return the shipping rates.
    return res.status(200).json({ rates });
  } catch (e) {
    console.error("Error in shippingrates endpoint:", e);
    return res.status(200).json({
      rates: [],
      errors: [{
        key: "serverError",
        message: "A server error occurred: " + e.message,
        preventCheckout: true
      }]
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//   Basic root route.
// ─────────────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Shipping webhook is live!");
});

app.listen(PORT, () =>
  console.log(`Shipping webhook running on port ${PORT}`)
);
