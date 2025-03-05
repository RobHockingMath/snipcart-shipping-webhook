import json
import requests
import logging
from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# 🔹 Replace with your Easyship Access Token
EASYSHIP_ACCESS_TOKEN = "prod_pIQhZNB1f/1bxFy9+DzhBA6HzcBskRNogjeKXV7gWq0="

@app.route("/snipcart-webhook", methods=["POST"])
def snipcart_webhook():
    logging.info("Webhook triggered!")
    logging.info("Request JSON: %s", request.json)
    try:
        order_data = request.json.get("content")
        if not order_data:
            logging.error("No order data found in payload.")
            return jsonify({"error": "Invalid data"}), 400

        # Handle items array safely: if empty, use default values.
        items = order_data.get("items", [])
        if items and len(items) > 0:
            product_description = items[0].get("description", "Product")
            # Try custom 'weight'; if missing, fall back to 'totalWeight' or default.
            product_weight = items[0].get("weight")
            if product_weight is None:
                product_weight = items[0].get("totalWeight", 0.5) or 0.5
            else:
                product_weight = float(product_weight)
            
            # Get dimensions if provided; otherwise, use defaults.
            product_length = items[0].get("length")
            product_width = items[0].get("width")
            product_height = items[0].get("height")
            if product_length is None or product_width is None or product_height is None:
                product_length = float(product_length) if product_length is not None else 10
                product_width  = float(product_width)  if product_width is not None else 10
                product_height = float(product_height) if product_height is not None else 10
            else:
                product_length = float(product_length)
                product_width = float(product_width)
                product_height = float(product_height)
        else:
            product_description = "Product"
            product_weight = 0.5
            product_length = 10
            product_width = 10
            product_height = 10

        # Build the shipment payload for Easyship.
        shipment_data = {
            "platform_name": "Snipcart",
            "selected_courier_id": "ups_express",
            "origin_address": {
                "line_1": "10F.-7, No. 48, Sec. 1, Kaifeng St.",
                "city": "Taipei",                # Added required city field
                "state": "Taipei",               # Adjust if needed
                "postal_code": "10044",
                "country_alpha2": "TW",          # Two-letter country code
                "contact_name": "Laird Robert Hocking",
                "contact_phone": "+886970159207",
                "contact_email": "robhocking.mathart@gmail.com",
                "company_name": "Rob Hocking Math Art"
            },
            "destination_address": {
                "line_1": order_data.get("shippingAddress", {}).get("address1", ""),
                "city": order_data.get("shippingAddress", {}).get("city", ""),
                "state": order_data.get("shippingAddress", {}).get("province", ""),
                "postal_code": order_data.get("shippingAddress", {}).get("postalCode", ""),
                "country_alpha2": order_data.get("shippingAddress", {}).get("country", ""),
                "contact_name": order_data.get("shippingAddressName", ""),
                # Provide a default phone number if blank:
                "contact_phone": order_data.get("shippingAddress", {}).get("phone", "0000000000"),
                "contact_email": order_data.get("email", "customer@example.com")
            },
            "parcels": [
                {
                    "description": product_description,
                    "weight": product_weight,
                    "dimensions": {
                        "length": product_length,
                        "width": product_width,
                        "height": product_height
                    },
                    "items": [
                        {
                            "description": product_description,
                            # Use 'actual_weight' for shipping calculations:
                            "actual_weight": product_weight,
                            # Use the order currency (default to CAD) as declared currency:
                            "declared_currency": order_data.get("currency", "CAD").upper(),
                            # Use the order subtotal as the declared customs value, if available:
                            "declared_customs_value": order_data.get("subtotal", 1900.0),
                            "dimensions": {
                                "length": product_length,
                                "width": product_width,
                                "height": product_height
                            },
                            # Provide a generic category; adjust as necessary:
                            "category": "Merchandise",
                            # Leave hs_code blank if not applicable:
                            "hs_code": ""
                        }
                    ]
                }
            ]
        }

        headers = {
            "Authorization": f"Bearer {EASYSHIP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        response = requests.post("https://api.easyship.com/v2/shipments", json=shipment_data, headers=headers)

        if response.status_code == 200:
            shipment = response.json()
            logging.info("Easyship API call succeeded: %s", shipment)
            return jsonify({
                "tracking_number": shipment.get("tracking_number"),
                "label_url": shipment.get("label_url")
            })
        else:
            logging.error("Easyship API call failed with status code %s and response: %s",
                          response.status_code, response.text)
            return jsonify({"error": "Failed to create shipment"}), 500

    except Exception as e:
        logging.exception("Exception occurred:")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Force the app to listen on port 5000 (matching Railway's expected upstream port)
    app.run(host="0.0.0.0", port=5000, debug=True)
