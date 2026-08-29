import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";

const PRODUCTS = [
  { name: "Whole Chicken", price: 600 },
  { name: "Chicken Breast", price: 750 },
  { name: "Chicken Leg", price: 700 },
  { name: "Chicken Wings", price: 550 },
  { name: "Chicken Thigh", price: 700 },
  { name: "Boneless Chicken", price: 800 },
];

const MAX_WEIGHT = 50;

export default function App() {
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    PRODUCTS.forEach((product) => {
      initial[product.name] = 0;
    });
    return initial;
  });

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const totalWeight = PRODUCTS.reduce((total, product) => {
    return total + Number(quantities[product.name] || 0);
  }, 0);

  const totalAmount = PRODUCTS.reduce((total, product) => {
    return (
      total +
      Number(quantities[product.name] || 0) * product.price
    );
  }, 0);

  const changeQuantity = (productName, amount) => {
    setQuantities((previous) => {
      const current = Number(previous[productName] || 0);
      const next = current + amount;

      if (next < 0) {
        return previous;
      }

      const newTotalWeight = totalWeight - current + next;

      if (newTotalWeight > MAX_WEIGHT) {
        Alert.alert(
          "50 KG Limit",
          "Maximum order limit is 50 kg."
        );
        return previous;
      }

      return {
        ...previous,
        [productName]: next,
      };
    });
  };

  const addToCart = (productName) => {
    changeQuantity(productName, 1);
  };

  const clearOrder = () => {
    Alert.alert(
      "Clear Order",
      "Are you sure you want to clear the complete order?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            const emptyQuantities = {};

            PRODUCTS.forEach((product) => {
              emptyQuantities[product.name] = 0;
            });

            setQuantities(emptyQuantities);
            setCustomerName("");
            setPhone("");
            setAddress("");
          },
        },
      ]
    );
  };

  const openWhatsApp = async (message) => {
    const encodedMessage = encodeURIComponent(message);

    const whatsappUrl =
      "whatsapp://send?text=" + encodedMessage;

    const webUrl =
      "https://wa.me/?text=" + encodedMessage;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);

      if (supported) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      const webSupported = await Linking.canOpenURL(webUrl);

      if (webSupported) {
        await Linking.openURL(webUrl);
        return;
      }

      Alert.alert(
        "WhatsApp",
        "WhatsApp open nahi ho raha. Please WhatsApp install/check karein."
      );
    } catch (error) {
      Alert.alert(
        "WhatsApp",
        "WhatsApp open nahi ho raha. Please WhatsApp install/check karein."
      );
    }
  };

  const requestLocation = () => {
    const message =
      "Assalam-o-Alaikum. Rizwee Brother Chicken Shop se order ke liye please apni LIVE LOCATION WhatsApp par share kar dein. JazakAllah Khair ❤️";

    openWhatsApp(message);
  };

  const sendOrder = () => {
    if (totalWeight <= 0) {
      Alert.alert(
        "Order Empty",
        "Please pehle chicken select karein."
      );
      return;
    }

    if (!customerName.trim()) {
      Alert.alert(
        "Customer Name",
        "Please customer name enter karein."
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        "Phone Number",
        "Please phone number enter karein."
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Delivery Address",
        "Please delivery address enter karein."
      );
      return;
    }

    let orderDetails = "";

    PRODUCTS.forEach((product) => {
      const quantity = Number(quantities[product.name] || 0);

      if (quantity > 0) {
        orderDetails +=
          product.name +
          ": " +
          quantity +
          " kg × Rs. " +
          product.price +
          " = Rs. " +
          quantity * product.price +
          "\n";
      }
    });

    const message =
      "🍗 RIZWEE BROTHER CHICKEN SHOP\n\n" +
      "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\n\n" +
      "الصلاة والسلام على محمد رسول الله صلى الله عليه وسلم\n\n" +
      "🛒 NEW ORDER\n\n" +
      "Customer Name: " +
      customerName +
      "\n" +
      "Phone: " +
      phone +
      "\n" +
      "Delivery Address: " +
      address +
      "\n\n" +
      "ORDER DETAILS:\n" +
      orderDetails +
      "\n" +
      "Total Weight: " +
      totalWeight +
      " kg\n" +
      "Total Amount: Rs. " +
      totalAmount +
      "\n\n" +
      "📍 Please share your LIVE LOCATION on WhatsApp.\n\n" +
      "JazakAllah Khair ❤️";

    openWhatsApp(message);
  };

  const callShop = async () => {
    const shopNumber = "PUT_SHOP_PHONE_NUMBER_HERE";

    if (shopNumber === "PUT_SHOP_PHONE_NUMBER_HERE") {
      Alert.alert(
        "Call Shop",
        "Shop ka phone number abhi app mein add nahi kiya gaya."
      );
      return;
    }

    const phoneUrl = "tel:" + shopNumber;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);

      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          "Call",
          "Phone calling is device par available nahi hai."
        );
      }
    } catch (error) {
      Alert.alert(
        "Call",
        "Phone calling open nahi ho rahi."
      );
    }
  };

  return (
    <View style={styles.main}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <View style={styles.islamicHeader}>
          <Text style={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </Text>

          <Text style={styles.salawat}>
            الصلاة والسلام على محمد رسول الله صلى الله عليه وسلم
          </Text>
        </View>

        <View style={styles.shopHeader}>
          <Text style={styles.shopEmoji}>🍗</Text>

          <Text style={styles.shopName}>
            Rizwee Brother Chicken Shop
          </Text>

          <Text style={styles.shopAddress}>
            📍 Kamran Shaheed Chowk, Karak, Pakistan
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          🍗 Chicken Products
        </Text>

        {PRODUCTS.map((product) => (
          <View
            style={styles.productCard}
            key={product.name}
          >
            <Text style={styles.productName}>
              {product.name}
            </Text>

            <Text style={styles.price}>
              Rs. {product.price}/kg
            </Text>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.minusButton}
                onPress={() =>
                  changeQuantity(product.name, -1)
                }
              >
                <Text style={styles.buttonText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.quantity}>
                {quantities[product.name]} kg
              </Text>

              <TouchableOpacity
                style={styles.plusButton}
                onPress={() =>
                  changeQuantity(product.name, 1)
                }
              >
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  addToCart(product.name)
                }
              >
                <Text style={styles.addText}>ADD</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.totalCard}>
          <Text style={styles.totalWeight}>
            Total Weight: {totalWeight} / {MAX_WEIGHT} kg
          </Text>

          <Text style={styles.totalAmount}>
            Total Amount: Rs. {totalAmount}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          👤 Customer Information
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Customer Name"
          placeholderTextColor="#777"
          value={customerName}
          onChangeText={setCustomerName}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#777"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={[styles.input, styles.addressInput]}
          placeholder="Delivery Address"
          placeholderTextColor="#777"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={requestLocation}
        >
          <Text style={styles.locationText}>
            📍 REQUEST CUSTOMER LOCATION
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={sendOrder}
        >
          <Text style={styles.whatsappText}>
            💬 SEND ORDER ON WHATSAPP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callButton}
          onPress={callShop}
        >
          <Text style={styles.callText}>
            📞 CALL SHOP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearOrder}
        >
          <Text style={styles.clearText}>
            🗑️ CLEAR ORDER
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rizwee Brother Chicken Shop
          </Text>

          <Text style={styles.footerAddress}>
            Kamran Shaheed Chowk, Karak, Pakistan
          </Text>

          <Text style={styles.footerThanks}>
            JazakAllah Khair ❤️
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scroll: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 50,
  },

  islamicHeader: {
    backgroundColor: "#0f6b3a",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    alignItems: "center",
  },

  bismillah: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  salawat: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 27,
  },

  shopHeader: {
    backgroundColor: "#fff7e6",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#f0d79b",
  },

  shopEmoji: {
    fontSize: 55,
    marginBottom: 8,
  },

  shopName: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    color: "#111111",
  },

  shopAddress: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#555555",
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 14,
    color: "#111111",
  },

  productCard: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 20,
    marginBottom: 15,
  },

  productName: {
    fontSize: 27,
    fontWeight: "900",
    color: "#111111",
  },

  price: {
    fontSize: 23,
    color: "#c62828",
    marginTop: 8,
    fontWeight: "700",
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  minusButton: {
    backgroundColor: "#222222",
    width: 65,
    height: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  plusButton: {
    backgroundColor: "#222222",
    width: 65,
    height: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 45,
  },

  quantity: {
    fontSize: 22,
    fontWeight: "800",
    marginHorizontal: 10,
    minWidth: 55,
    textAlign: "center",
  },

  addButton: {
    flex: 1,
    marginLeft: 8,
    height: 60,
    borderRadius: 17,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },

  totalCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#b7d8ba",
  },

  totalWeight: {
    fontSize: 24,
    fontWeight: "900",
    color: "#155724",
  },

  totalAmount: {
    fontSize: 25,
    fontWeight: "900",
    color: "#c62828",
    marginTop: 8,
  },

  input: {
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    marginBottom: 12,
    color: "#111111",
  },

  addressInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  locationButton: {
    backgroundColor: "#1976d2",
    borderRadius: 17,
    padding: 18,
    alignItems: "center",
    marginTop: 5,
  },

  locationText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  whatsappButton: {
    backgroundColor: "#168a3a",
    borderRadius: 17,
    padding: 19,
    alignItems: "center",
    marginTop: 12,
  },

  whatsappText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  callButton: {
    backgroundColor: "#222222",
    borderRadius: 17,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
  },

  callText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  clearButton: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#ef9a9a",
    borderRadius: 17,
    padding: 17,
    alignItems: "center",
    marginTop: 12,
  },

  clearText: {
    color: "#c62828",
    fontSize: 18,
    fontWeight: "900",
  },

  footer: {
    alignItems: "center",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
  },

  footerText: {
    fontSize: 20,
    fontWeight: "900",
  },

  footerAddress: {
    fontSize: 14,
    color: "#666666",
    marginTop: 6,
    textAlign: "center",
  },

  footerThanks: {
    fontSize: 17,
    marginTop: 10,
    fontWeight: "700",
  },
});
