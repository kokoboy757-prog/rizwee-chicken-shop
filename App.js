import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

// ===============================
// FIREBASE CONFIG
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyCo6ITJxCWLF4TP_lQlZRt-YEMwF_hoiDo",
  authDomain: "rizwee-brothers-chicken-shop.firebaseapp.com",
  databaseURL:
    "https://rizwee-brothers-chicken-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rizwee-brothers-chicken-shop",
  storageBucket: "rizwee-brothers-chicken-shop.firebasestorage.app",
  messagingSenderId: "452814450510",
  appId: "1:452814450510:android:13d1cf125d9a6719d4381f",
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// ===============================
// DEFAULT PRODUCTS
// Used only if Firebase data
// cannot be loaded.
// ===============================

const DEFAULT_PRODUCTS = [
  { id: "whole_chicken", name: "Whole Chicken", price: 600 },
  { id: "chicken_breast", name: "Chicken Breast", price: 750 },
  { id: "chicken_leg", name: "Chicken Leg", price: 700 },
  { id: "chicken_wings", name: "Chicken Wings", price: 550 },
  { id: "chicken_thigh", name: "Chicken Thigh", price: 700 },
  { id: "boneless_chicken", name: "Boneless Chicken", price: 800 },
];

const MAX_WEIGHT = 50;

const DEFAULT_WHATSAPP_NUMBER = "923363299194";
const DEFAULT_CALL_NUMBER = "923363299194";

// ===============================
// HELPER
// ===============================

const formatProductName = (id) => {
  return String(id)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// ===============================
// APP
// ===============================

export default function App() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});

  const [whatsappNumber, setWhatsappNumber] = useState(
    DEFAULT_WHATSAPP_NUMBER
  );

  const [callNumber, setCallNumber] = useState(
    DEFAULT_CALL_NUMBER
  );

  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // ===============================
  // LOAD FIREBASE DATA
  // ===============================

  useEffect(() => {
    loadFirebaseData();
  }, []);

  const loadFirebaseData = async () => {
    try {
      setLoading(true);

      // -------------------------------
      // PRODUCTS
      // -------------------------------

      const productsSnapshot = await get(
        ref(database, "products")
      );

      if (productsSnapshot.exists()) {
        const firebaseProducts = productsSnapshot.val();

        const productList = Object.entries(
          firebaseProducts
        ).map(([id, value]) => ({
          id,
          name: formatProductName(id),
          price: Number(value) || 0,
        }));

        setProducts(productList);

        const initialQuantities = {};

        productList.forEach((product) => {
          initialQuantities[product.id] = 0;
        });

        setQuantities(initialQuantities);
      } else {
        setProducts(DEFAULT_PRODUCTS);

        const initialQuantities = {};

        DEFAULT_PRODUCTS.forEach((product) => {
          initialQuantities[product.id] = 0;
        });

        setQuantities(initialQuantities);
      }

      // -------------------------------
      // SETTINGS
      // -------------------------------

      const settingsSnapshot = await get(
        ref(database, "settings")
      );

      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.val();

        if (settings.whatsapp_number) {
          setWhatsappNumber(
            String(settings.whatsapp_number)
          );
        }

        if (settings.call_number) {
          setCallNumber(
            String(settings.call_number)
          );
        }
      }
    } catch (error) {
      console.log("Firebase error:", error);

      Alert.alert(
        "Connection",
        "Firebase data load nahi ho saka. Default shop data use kiya ja raha hai."
      );

      setProducts(DEFAULT_PRODUCTS);

      const initialQuantities = {};

      DEFAULT_PRODUCTS.forEach((product) => {
        initialQuantities[product.id] = 0;
      });

      setQuantities(initialQuantities);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // TOTAL WEIGHT
  // ===============================

  const totalWeight = products.reduce((total, product) => {
    return (
      total +
      Number(quantities[product.id] || 0)
    );
  }, 0);

  // ===============================
  // TOTAL AMOUNT
  // ===============================

  const totalAmount = products.reduce((total, product) => {
    return (
      total +
      Number(quantities[product.id] || 0) *
        Number(product.price || 0)
    );
  }, 0);

  // ===============================
  // CHANGE QUANTITY
  // ===============================

  const changeQuantity = (productId, amount) => {
    setQuantities((previous) => {
      const current = Number(
        previous[productId] || 0
      );

      const next = current + amount;

      if (next < 0) {
        return previous;
      }

      const newTotalWeight =
        totalWeight - current + next;

      if (newTotalWeight > MAX_WEIGHT) {
        Alert.alert(
          "50 KG Limit",
          "Maximum order limit is 50 kg."
        );

        return previous;
      }

      return {
        ...previous,
        [productId]: next,
      };
    });
  };

  // ===============================
  // ADD TO CART
  // ===============================

  const addToCart = (productId) => {
    changeQuantity(productId, 1);
  };

  // ===============================
  // CLEAR ORDER
  // ===============================

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

            products.forEach((product) => {
              emptyQuantities[product.id] = 0;
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

  // ===============================
  // OPEN WHATSAPP
  // ===============================

  const openWhatsApp = async (message) => {
    const encodedMessage =
      encodeURIComponent(message);

    const url =
      "https://wa.me/" +
      whatsappNumber +
      "?text=" +
      encodedMessage;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "WhatsApp",
        "WhatsApp open nahi ho raha. Please WhatsApp install/check karein."
      );
    }
  };

  // ===============================
  // REQUEST LOCATION
  // ===============================

  const requestLocation = () => {
    const message =
      "Assalam-o-Alaikum. Rizwee Brother Chicken Shop se order ke liye please apni LIVE LOCATION WhatsApp par share kar dein. JazakAllah Khair ❤️";

    openWhatsApp(message);
  };

  // ===============================
  // SEND ORDER
  // ===============================

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

    products.forEach((product) => {
      const quantity = Number(
        quantities[product.id] || 0
      );

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

  // ===============================
  // CALL SHOP
  // ===============================

  const callShop = async () => {
    const phoneUrl = "tel:" + callNumber;

    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      Alert.alert(
        "Call",
        "Phone calling open nahi ho rahi."
      );
    }
  };

  // ===============================
  // LOADING SCREEN
  // ===============================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingEmoji}>
          🍗
        </Text>

        <Text style={styles.loadingTitle}>
          Rizwee Brother Chicken Shop
        </Text>

        <ActivityIndicator
          size="large"
          color="#0f6b3a"
          style={{ marginTop: 20 }}
        />

        <Text style={styles.loadingText}>
          Loading shop data...
        </Text>
      </View>
    );
  }

  // ===============================
  // MAIN UI
  // ===============================

  return (
    <View style={styles.main}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        {/* Islamic Header */}

        <View style={styles.islamicHeader}>
          <Text style={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </Text>

          <Text style={styles.salawat}>
            الصلاة والسلام على محمد رسول الله صلى الله عليه وسلم
          </Text>
        </View>

        {/* Shop Header */}

        <View style={styles.shopHeader}>
          <Text style={styles.shopEmoji}>
            🍗
          </Text>

          <Text style={styles.shopName}>
            Rizwee Brother Chicken Shop
          </Text>

          <Text style={styles.shopAddress}>
            📍 Kamran Shaheed Chowk, Karak, Pakistan
          </Text>
        </View>

        {/* Products */}

        <Text style={styles.sectionTitle}>
          🍗 Chicken Products
        </Text>

        {products.map((product) => (
          <View
            style={styles.productCard}
            key={product.id}
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
                  changeQuantity(
                    product.id,
                    -1
                  )
                }
              >
                <Text style={styles.buttonText}>
                  −
                </Text>
              </TouchableOpacity>

              <Text style={styles.quantity}>
                {quantities[product.id] || 0} kg
              </Text>

              <TouchableOpacity
                style={styles.plusButton}
                onPress={() =>
                  changeQuantity(
                    product.id,
                    1
                  )
                }
              >
                <Text style={styles.buttonText}>
                  +
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  addToCart(product.id)
                }
              >
                <Text style={styles.addText}>
                  ADD
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Total */}

        <View style={styles.totalCard}>
          <Text style={styles.totalWeight}>
            Total Weight: {totalWeight} /{" "}
            {MAX_WEIGHT} kg
          </Text>

          <Text style={styles.totalAmount}>
            Total Amount: Rs. {totalAmount}
          </Text>
        </View>

        {/* Customer Information */}

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
          style={[
            styles.input,
            styles.addressInput,
          ]}
          placeholder="Delivery Address"
          placeholderTextColor="#777"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        {/* Location */}

        <TouchableOpacity
          style={styles.locationButton}
          onPress={requestLocation}
        >
          <Text style={styles.locationText}>
            📍 REQUEST CUSTOMER LOCATION
          </Text>
        </TouchableOpacity>

        {/* WhatsApp Order */}

        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={sendOrder}
        >
          <Text style={styles.whatsappText}>
            💬 SEND ORDER ON WHATSAPP
          </Text>
        </TouchableOpacity>

        {/* Call */}

        <TouchableOpacity
          style={styles.callButton}
          onPress={callShop}
        >
          <Text style={styles.callText}>
            📞 CALL SHOP
          </Text>
        </TouchableOpacity>

        {/* Clear */}

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearOrder}
        >
          <Text style={styles.clearText}>
            🗑️ CLEAR ORDER
          </Text>
        </TouchableOpacity>

        {/* Footer */}

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

// ===============================
// STYLES
// ===============================

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

  loadingScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  loadingEmoji: {
    fontSize: 60,
  },

  loadingTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },

  loadingText: {
    fontSize: 17,
    color: "#666666",
    marginTop: 15,
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
