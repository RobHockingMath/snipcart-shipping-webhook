import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# 🔹 Replace with your Easyship Access Token
EASYSHIP_ACCESS_TOKEN = "your_access_token_here"

@app.route("/snipcart-webhook", methods=["POST"])
def snipcart_webhook():
    try:
        order_data = request.json.get("content")
        if not order_data:
            return jsonify({"error": "Invalid data"}), 400
        
        # Send order to Easyship API
        headers = {
            "Authorization": f"Bearer {EASYSHIP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        shipment_data = {
            "platform_name": "Snipcart",
            "selected_courier_id": "ups_express",
            "origin_address": {
                "street_address": "Your Address",
                "city": "Taipei",
                "country_alpha2": "TW"
            },
            "destination_address": {
                "contact_name": order_data["billingAddressName"],
                "street_address": order_data["shippingAddressAddress1"],
                "city": order_data["shippingAddressCity"],
                "country_alpha2": order_data["shippingAddressCountry"]
            },
            "items": [
                {"description": "Hologram", "quantity": 1, "actual_weight": 0.5, "declared_currency": "TWD"}
            ]
        }
        response = requests.post("https://api.easyship.com/v2/shipments", json=shipment_data, headers=headers)

        if response.status_code == 200:
            shipment = response.json()
            return jsonify({
                "tracking_number": shipment.get("tracking_number"),
                "label_url": shipment.get("label_url")
            })
        else:
            return jsonify({"error": "Failed to create shipment"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
