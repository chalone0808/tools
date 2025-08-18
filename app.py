from flask import Flask, render_template, request
from tools.register_bits import parse_register

app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.route("/")
def home():
    """Main page with list of tools"""
    return render_template("index.html")


@app.route("/register-bit-fields")
def register_bits():
    """Register Bits tool page"""
    return render_template("register_bits.html")


@app.route("/parse-register", methods=["POST"])
def parse_register_route():
    """Route handler for parsing register values"""
    data = request.get_json()
    return parse_register(data)


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5100)
