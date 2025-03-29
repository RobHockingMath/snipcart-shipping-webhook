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

//
// ─────────────────────────────────────────────────────────────────────────────
//   :: All shipping cost arrays
// ─────────────────────────────────────────────────────────────────────────────
//

// (All your country arrays remain unchanged, e.g., TW_fast, TW_slow, etc.)

// ... [Insert all country arrays here exactly as in your code] ...

//
// ─────────────────────────────────────────────────────────────────────────────
//   Build the shippingRates dictionary with delay times included.
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
        cost: costArray[i],
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

//
// ─────────────────────────────────────────────────────────────────────────────
//   Log maximum allowed weight for each country and each shipping method.
// ─────────────────────────────────────────────────────────────────────────────
//
for (const country in shippingRates) {
  for (const method in shippingRates[country]) {
    const costMap = shippingRates[country][method];
    const validWeights = allowedWeights.filter(w => {
      const key = w.toFixed(2);
      return costMap[key] && costMap[key].cost !== undefined;
    });
    if (validWeights.length > 0) {
      const maxWeight = validWeights[validWeights.length - 1];
      console.log(`Max allowed weight for ${country} ${method} shipping is ${maxWeight} kg`);
    } else {
      console.log(`No valid weight brackets for ${country} ${method} shipping.`);
    }
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
 * first allowed bracket that is greater than or equal to totalWeightKg.
 */
function findBracketCost(country, method, totalWeightKg) {
  if (!shippingRates[country] || !shippingRates[country][method]) {
    console.log(`Invalid country or method: ${country}, ${method}`);
    return null;
  }
  const costMap = shippingRates[country][method];
  const validWeights = allowedWeights.filter(w => {
    const key = w.toFixed(2);
    return costMap[key] && costMap[key].cost !== undefined;
  });
  if (validWeights.length === 0) return null;
  const maxWeightPossible = validWeights[validWeights.length - 1];
  console.log(`DEBUG: Total weight: ${totalWeightKg} kg, Max allowed for ${country} ${method} shipping: ${maxWeightPossible} kg`);
  if (totalWeightKg > maxWeightPossible) {
    console.log(`DEBUG: Order weight (${totalWeightKg} kg) exceeds maximum allowed (${maxWeightPossible} kg).`);
    return null;
  }
  for (let w of validWeights) {
    if (w >= totalWeightKg) {
      console.log(`DEBUG: Found bracket: ${w} kg with cost ${costMap[w.toFixed(2)].cost}`);
      return costMap[w.toFixed(2)].cost;
    }
  }
  console.log(`DEBUG: No valid bracket found for weight ${totalWeightKg} kg.`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//   Shipping webhook endpoint (Snipcart v3)
// ─────────────────────────────────────────────────────────────────────────────
app.post("/shipping-rates", (req, res) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    const raw = req.body.content || req.body;
    let shippingAddress = raw.shippingAddress || {};
    // If no country is found in shippingAddress, try falling back to these alternatives:
    if (!shippingAddress.country) {
      if (raw.shippingAddressCountry) {
        shippingAddress.country = raw.shippingAddressCountry;
      } else if (raw.billingAddress && raw.billingAddress.country) {
        shippingAddress.country = raw.billingAddress.country;
      }
    }
    const { currency, items } = raw;
    if (!shippingAddress || !shippingAddress.country) {
      return res.status(200).json({
        rates: [],
        errors: [
          {
            key: "noCountry",
            message: "Missing shipping country."
          }
        ]
      });
    }
    const countryCode = shippingAddress.country.toUpperCase();
    if (!shippingRates[countryCode]) {
      return res.status(200).json({
        rates: [],
        errors: [
          {
            key: "unsupportedCountry",
            message: "We do not ship to this country."
          }
        ]
      });
    }
    if (!items || items.length === 0) {
      return res.status(200).json({
        errors: [
          {
            key: "noItems",
            message: "No items in the order."
          }
        ]
      });
    }
    let totalWeightKg = items.reduce((sum, item) => {
      const w = parseFloat(item.weight) || 0;
      const qty = parseFloat(item.quantity) || 1;
      return sum + w * qty;
    }, 0);
    totalWeightKg = Math.round(totalWeightKg * 100) / 100;
    console.log(`Total weight: ${totalWeightKg} kg`);
    const userCurrency = (currency || "").toLowerCase();
    const convRate = conversionRates[userCurrency] || 1;
    console.log(`Snipcart currency: ${currency}, convRate: ${convRate}`);
    let rates = [];
    const fastCostRaw = findBracketCost(countryCode, "fast", totalWeightKg);
    if (fastCostRaw !== null) {
      const costConverted = parseFloat((fastCostRaw * convRate).toFixed(2));
      rates.push({
        cost: costConverted,
        description: "Fast Shipping",
        guaranteedDaysToDelivery: shippingRates[countryCode]["fast"][allowedWeights[allowedWeights.length - 1].toFixed(2)].delay.max,
        userDefinedId: "fast_shipping_" + countryCode,
        delay: shippingRates[countryCode]["fast"][allowedWeights[allowedWeights.length - 1].toFixed(2)].delay
      });
    }
    const slowCostRaw = findBracketCost(countryCode, "slow", totalWeightKg);
    if (slowCostRaw !== null) {
      const costConverted = parseFloat((slowCostRaw * convRate).toFixed(2));
      rates.push({
        cost: costConverted,
        description: "Slow Shipping",
        guaranteedDaysToDelivery: shippingRates[countryCode]["slow"][allowedWeights[allowedWeights.length - 1].toFixed(2)].delay.max,
        userDefinedId: "slow_shipping_" + countryCode,
        delay: shippingRates[countryCode]["slow"][allowedWeights[allowedWeights.length - 1].toFixed(2)].delay
      });
    }
    if (rates.length === 0) {
      return res.status(200).json({
        errors: [
          {
            key: "noMethodsOrOverweight",
            message: "No shipping method can handle that weight for this destination."
          }
        ]
      });
    }
    return res.status(200).json({ rates });
  } catch (e) {
    console.error("Error in shipping-rates endpoint:", e);
    return res.status(200).json({
      errors: [
        {
          key: "serverError",
          message: "A server error occurred: " + e.message
        }
      ]
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//   Basic root route.
// ─────────────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Shipping webhook is live!");
});

// Test endpoint for manual cost checking.
app.get("/test-cost", (req, res) => {
  const country = req.query.country ? req.query.country.toUpperCase() : "US";
  const method = req.query.method || "fast";
  const weight = parseFloat(req.query.weight) || 10;
  const cost = findBracketCost(country, method, weight);
  res.json({ country, method, weight, calculatedCost: cost });
});

app.listen(PORT, () =>
  console.log(`Shipping webhook running on port ${PORT}`)
);

