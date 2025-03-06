const express = require("express");
const app = express();
app.use(express.json());

// Define shipping rates per 0.5kg in NTD (New Taiwan Dollar)
const shippingRatesNTD = {
    "TW": { fast: 120, slow: 60 },   // Taiwan
    "HK": { fast: 700, slow: 350 },  // Hong Kong
    "SG": { fast: 900, slow: 450 },  // Singapore
    "JP": { fast: 4500, slow: 2400 }, // Japan
    "KR": { fast: 54000, slow: 27000 }, // Korea
    "GB": { fast: 800, slow: 400 },  // United Kingdom
    "US": { fast: 900, slow: 540 },  // United States
    "CA": { fast: 1080, slow: 648 }  // Canada
};

// Define delivery times (fixed per country)
const shippingTimes = {
    "TW": { fast: 1, slow: 3 },   // Taiwan
    "HK": { fast: 2, slow: 7 },   // Hong Kong
    "SG": { fast: 3, slow: 8 },   // Singapore
    "JP": { fast: 3, slow: 9 },   // Japan
    "KR": { fast: 4, slow: 10 },  // Korea
    "GB": { fast: 5, slow: 12 },  // United Kingdom
    "US": { fast: 6, slow: 14 },  // United States
    "CA": { fast: 6, slow: 14 }   // Canada
};

// NTD conversion rates (approximate, update as needed)
const conversionRates = {
    "NTD": 1,  // Base currency
    "HKD": 0.25, // 1 NTD ≈ 0.25 HKD
    "SGD": 0.045, // 1 NTD ≈ 0.045 SGD
    "JPY": 4.5,  // 1 NTD ≈ 4.5 JPY
    "KRW": 42,   // 1 NTD ≈ 42 KRW
    "GBP": 0.025, // 1 NTD ≈ 0.025 GBP
    "USD": 0.03,  // 1 NTD ≈ 0.03 USD
    "CAD": 0.04   // 1 NTD ≈ 0.04 CAD
};

// Webhook endpoint
app.post("/shippingrates", (req, res) => {
    const { currency, items, shippingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ rates: [], error: "Missing shipping country" });
    }

    const countryCode = shippingAddress.country.toUpperCase();

    // If the country is not supported, return an empty rates list
    if (!shippingRatesNTD[countryCode]) {
        return res.status(400).json({ rates: [], error: "We do not ship to this country" });
    }

    // Convert total weight from grams to kg, round up to nearest 0.5kg
    let totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    totalWeight = Math.ceil(totalWeight / 500) * 0.5;

    // Get shipping rates in NTD
    const fastCostNTD = shippingRatesNTD[countryCode].fast * totalWeight;
    const slowCostNTD = shippingRatesNTD[countryCode].slow * totalWeight;

    // Convert from NTD to the customer's selected currency
    const conversionRate = conversionRates[currency] || 1; // Default to NTD if no conversion exists
    const fastCost = (fastCostNTD * conversionRate).toFixed(2);
    const slowCost = (slowCostNTD * conversionRate).toFixed(2);

    // Get estimated delivery times
    const fastTime = shippingTimes[countryCode].fast;
    const slowTime = shippingTimes[countryCode].slow;

    res.json({
        rates: [
            {
                cost: fastCost,
                description: `Fast Shipping (${fastTime} days)`,
                delay: { minimum: fastTime, maximum: fastTime },
            },
            {
                cost: slowCost,
                description: `Slow Shipping (${slowTime} days)`,
                delay: { minimum: slowTime, maximum: slowTime },
            },
        ],
    });
});

app.listen(3000, () => console.log("Shipping webhook running on port 3000"));
