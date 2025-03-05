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

        # If there are no items, no need to call Easyship.
        items = order_data.get("items", [])
        if not items or len(items) == 0:
            logging.warning("No items in the order. Skipping shipment creation.")
            return jsonify({"error": "No items in order"}), 400

        product_description = items[0].get("description", "Product")
        product_weight = items[0].get("weight")
        if product_weight is None:
            product_weight = items[0].get("totalWeight", 0.5) or 0.5
        else:
            product_weight = float(product_weight)

        product_length = items[0].get("length")
        product_width = items[0].get("width")
        product_height = items[0].get("height")
        if product_length is None or product_width is None or product_height is None:
            product_length = float(product_length) if product_length is not None else 10
            product_width  = float(product_width)  if product_width is not None else 10
            product_height = float(product_height) if product_height is not None else 10
        else:
            product_length = float(product_length)
            product_width  = float(product_width)
            product_height = float(product_height)

        # Force a positive declared customs value
        declared_value = order_data.get("subtotal", 0)
        try:
            declared_value = float(declared_value)
        except ValueError:
            declared_value = 0

        # Easyship requires > 0
        if declared_value <= 0:
            declared_value = 1.0  # fallback to 1 if the subtotal is zero or missing

        # Check destination phone and set default if empty
        dest_phone = order_data.get("shippingAddress", {}).get("phone", "").strip()
        if not dest_phone:
            dest_phone = "0000000000"

        shipment_data = {
            "platform_name": "Snipcart",
            "selected_courier_id": "ups_express",
            "origin_address": {
                "line_1": "10F.-7, No. 48, Sec. 1, Kaifeng St.",
                "city": "Taipei",
                "state": "Taipei",
                "postal_code": "10044",
                "country_alpha2": "TW",
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
                "contact_phone": dest_phone,
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
                            "actual_weight": product_weight,
                            "declared_currency": order_data.get("currency", "CAD").upper(),
                            "declared_customs_value": declared_value,
                            "dimensions": {
                                "length": product_length,
                                "width": product_width,
                                "height": product_height
                            },
                            "category": "Merchandise",
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
        response = requests.post(
            "https://api.easyship.com/v2/shipments", 
            json=shipment_data, 
            headers=headers
        )

        if response.status_code == 200:
            shipment = response.json()
            logging.info("Easyship API call succeeded: %s", shipment)
            return jsonify({
                "tracking_number": shipment.get("tracking_number"),
                "label_url": shipment.get("label_url")
            })
        else:
            logging.error(
                "Easyship API call failed with status code %s and response: %s",
                response.status_code,
                response.text
            )
            return jsonify({"error": "Failed to create shipment"}), 500

    except Exception as e:
        logging.exception("Exception occurred:")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Force the app to listen on port 5000 (matching Railway's expected upstream port)
    app.run(host="0.0.0.0", port=5000, debug=True)
