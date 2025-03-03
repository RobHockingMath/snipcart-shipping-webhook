import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# 🔹 Replace with your Easyship Access Token
EASYSHIP_ACCESS_TOKEN = "prod_pIQhZNB1f/1bxFy9+DzhBA6HzcBskRNogjeKXV7gWq0="

@app.route("/snipcart-webhook", methods=["POST"])
def snipcart_webhook():
    print("Webhook triggered!")
    print("Request JSON:", request.json)
    try:
        order_data = request.json.get("content")
        if not order_data:
            print("No order data found in payload.")
            return jsonify({"error": "Invalid data"}), 400

        # Build the shipment payload for Easyship
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
                {"description": "Your Actual Product", "quantity": 1, "actual_weight": 0.5, "declared_currency": "TWD"}
            ]
        }
        response = requests.post("https://api.easyship.com/v2/shipments", json=shipment_data, headers=headers)

        if response.status_code == 200:
            shipment = response.json()
            print("Easyship API call succeeded:", shipment)
            return jsonify({
                "tracking_number": shipment.get("tracking_number"),
                "label_url": shipment.get("label_url")
            })
        else:
            print("Easyship API call failed with status code", response.status_code, "and response:", response.text)
            return jsonify({"error": "Failed to create shipment"}), 500

    except Exception as e:
        print("Exception occurred:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Force the app to listen on port 5000 to match Railway's expected upstream port
    app.run(host="0.0.0.0", port=5000, debug=True)

