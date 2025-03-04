import json
import requests
import logging
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configure logging to capture detailed output
logging.basicConfig(level=logging.DEBUG)

# 🔹 Replace with your Easyship Access Token (if needed)
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

        # Build the shipment payload for Easyship with required fields.
        # Origin address details are taken from your Easyship account.
        shipment_data = {
            "platform_name": "Snipcart",
            "selected_courier_id": "ups_express",
            "origin_address": {
                "line_1": "10F.-7, No. 48, Sec. 1, Kaifeng St.",
                "state": "Taipei",           # You might leave it as "Taipei" or add additional region info if required
                "postal_code": "10044",
                "contact_name": "Laird Robert Hocking",
                "contact_phone": "+886970159207",
                "contact_email": "robhocking.mathart@gmail.com",
                "company_name": "Rob Hocking Math Art"
            },
            "destination_address": {
                # Mapping destination details from Snipcart order data.
                # Note: Adjust key names if needed depending on the structure.
                "line_1": order_data.get("shippingAddress", {}).get("address1", ""),
                "state": order_data.get("shippingAddress", {}).get("province", ""),
                "postal_code": order_data.get("shippingAddress", {}).get("postalCode", ""),
                "contact_name": order_data.get("shippingAddressName", ""),
                "contact_phone": order_data.get("shippingAddress", {}).get("phone", ""),
                # Fallback email: If order_data doesn't have an email, you may need a default.
                "contact_email": order_data.get("email", "customer@example.com")
            },
            "parcels": [
                {
                    # Build a parcel based on the first item in the order.
                    # Adjust these values as needed or build dynamically for multiple items.
                    "description": order_data.get("items", [{}])[0].get("description", "Product"),
                    "weight": order_data.get("items", [{}])[0].get("totalWeight", 0.5) or 0.5,
                    "dimensions": {
                        "length": 10,  # Dummy value; replace with actual dimensions if available
                        "width": 10,
                        "height": 10
                    }
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
            logging.error("Easyship API call failed with status code %s and response: %s", response.status_code, response.text)
            return jsonify({"error": "Failed to create shipment"}), 500

    except Exception as e:
        logging.exception("Exception occurred:")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Force the app to listen on port 5000 to match Railway's expected upstream port.
    app.run(host="0.0.0.0", port=5000, debug=True)
