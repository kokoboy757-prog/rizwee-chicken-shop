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
} from "react-native";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
} from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// ======================================================
// FIREBASE CONFIG
// ======================================================

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
const auth = getAuth(firebaseApp);

// ======================================================
// DEFAULT PRODUCTS
// ======================================================

const DEFAULT_PRODUCTS = [
  { id: "whole-chicken", name: "Whole Chicken", price: 600 },
  { id: "chicken-breast", name: "Chicken Breast", price: 750 },
  { id: "chicken-leg", name: "Chicken Leg", price: 700 },
  { id: "chicken-wings", name: "Chicken Wings", price: 550 },
  { id: "chicken-thigh", name: "Chicken Thigh", price: 700 },
  { id: "boneless-chicken", name: "Boneless Chicken", price: 800 },
];

const DEFAULT_SETTINGS = {
  whatsappNumber: "923363299194",
  callNumber: "+923363299194",
};

const MAX_WEIGHT = 50;

// ======================================================
// APP
// ======================================================

export default function App() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [quantities, setQuantities] = useState({});

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [user, setUser] = useState(null);

  const [adminMode, setAdminMode] = useState(false);

  const [loading, setLoading] = useState(true);

  // ====================================================
  // ADMIN LOGIN FIELDS
  // ====================================================

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // ====================================================
  // NEW PRODUCT FIELDS
  // ====================================================

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  // ====================================================
  // FIREBASE AUTH
  // ====================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  // ====================================================
  // LOAD PRODUCTS FROM FIREBASE
  // ====================================================

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const firebaseProducts = Object.keys(data).map((id) => ({
            id,
            name: data[id].name || "",
            price: Number(data[id].price || 0),
          }));

          setProducts(firebaseProducts);

          const initialQuantities = {};

          firebaseProducts.forEach((product) => {
            initialQuantities[product.id] = 0;
          });

          setQuantities(initialQuantities);
        } else {
          // If products do not exist yet, create defaults.
          const defaultObject = {};

          DEFAULT_PRODUCTS.forEach((product) => {
            defaultObject[product.id] = {
              name: product.name,
              price: product.price,
            };
          });

          set(productsRef, defaultObject);

          setProducts(DEFAULT_PRODUCTS);

          const initialQuantities = {};

          DEFAULT_PRODUCTS.forEach((product) => {
            initialQuantities[product.id] = 0;
          });

          setQuantities(initialQuantities);
        }

        setLoading(false);
      },
      (error) => {
        console.log("Products error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // ====================================================
  // LOAD SETTINGS FROM FIREBASE
  // ====================================================

  useEffect(() => {
    const settingsRef = ref(database, "settings");

    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setSettings({
            whatsappNumber:
              data.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,

            callNumber:
              data.callNumber || DEFAULT_SETTINGS.callNumber,
          });
        } else {
          set(settingsRef, DEFAULT_SETTINGS);
        }
      },
      (error) => {
        console.log("Settings error:", error);
      }
    );

    return unsubscribe;
  }, []);

  // ====================================================
  // TOTAL WEIGHT
  // ====================================================

  const totalWeight = products.reduce((total, product) => {
    return total + Number(quantities[product.id] || 0);
  }, 0);

  // ====================================================
  // TOTAL AMOUNT
  // ====================================================

  const totalAmount = products.reduce((total, product) => {
    return (
      total +
      Number(quantities[product.id] || 0) * Number(product.price || 0)
    );
  }, 0);

  // ====================================================
  // CHANGE QUANTITY
  // ====================================================

  const changeQuantity = (productId, amount) => {
    setQuantities((previous) => {
      const current = Number(previous[productId] || 0);

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
        [productId]: next,
      };
    });
  };

  // ====================================================
  // ADD TO CART
  // ====================================================

  const addToCart = (productId) => {
    changeQuantity(productId, 1);
  };

  // ====================================================
  // CLEAR ORDER
  // ====================================================

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

  // ====================================================
  // OPEN WHATSAPP
  // ====================================================

  const openWhatsApp = async (message) => {
    const number = String(settings.whatsappNumber || "")
      .replace(/\s/g, "")
      .replace(/^\+/, "");

    const encodedMessage = encodeURIComponent(message);

    const url =
      "https://wa.me/" +
      number +
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

  // ====================================================
  // REQUEST LOCATION
  // ====================================================

  const requestLocation = () => {
    const message =
      "Assalam-o-Alaikum. Rizwee Brother Chicken Shop se order ke liye please apni LIVE LOCATION WhatsApp par share kar dein. JazakAllah Khair ❤️";

    openWhatsApp(message);
  };

  // ====================================================
  // SEND ORDER
  // ====================================================

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

  // ====================================================
  // CALL SHOP
  // ====================================================

  const callShop = async () => {
    const phoneNumber = String(settings.callNumber || "")
      .replace(/\s/g, "");

    const phoneUrl = "tel:" + phoneNumber;

    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      Alert.alert(
        "Call",
        "Phone calling open nahi ho rahi."
      );
    }
  };

  // ====================================================
  // ADMIN LOGIN
  // ====================================================

  const adminLogin = async () => {
    if (!adminEmail.trim()) {
      Alert.alert(
        "Admin Login",
        "Please admin email enter karein."
      );

      return;
    }

    if (!adminPassword) {
      Alert.alert(
        "Admin Login",
        "Please password enter karein."
      );

      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          adminEmail.trim(),
          adminPassword
        );

      // Only your Firebase UID can use admin management.
      if (
        result.user.uid !==
        "vCG8IaUJl0WJjCsP2JsuJdoF0wk1"
      ) {
        await signOut(auth);

        Alert.alert(
          "Access Denied",
          "Ye account admin nahi hai."
        );

        return;
      }

      setAdminMode(true);

      setAdminPassword("");

      Alert.alert(
        "Admin",
        "Admin login successful."
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Admin Login Failed",
        "Email ya password ghalat hai."
      );
    }
  };

  // ====================================================
  // ADMIN LOGOUT
  // ====================================================

  const adminLogout = async () => {
    try {
      await signOut(auth);

      setAdminMode(false);
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================================
  // ADD PRODUCT
  // ====================================================

  const addProduct = async () => {
    if (!user) {
      Alert.alert(
        "Admin",
        "Please pehle admin login karein."
      );

      return;
    }

    if (
      user.uid !==
      "vCG8IaUJl0WJjCsP2JsuJdoF0wk1"
    ) {
      Alert.alert(
        "Access Denied",
        "Aap admin nahi hain."
      );

      return;
    }

    const name = newProductName.trim();

    const price = Number(
      newProductPrice.trim()
    );

    if (!name) {
      Alert.alert(
        "Product",
        "Product name enter karein."
      );

      return;
    }

    if (!price || price <= 0) {
      Alert.alert(
        "Price",
        "Valid price enter karein."
      );

      return;
    }

    const id =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now();

    try {
      await set(
        ref(database, "products/" + id),
        {
          name,
          price,
        }
      );

      setNewProductName("");
      setNewProductPrice("");

      Alert.alert(
        "Success",
        "Product successfully add ho gaya."
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "Product add nahi ho saka."
      );
    }
  };

  // ====================================================
  // UPDATE PRODUCT
  // ====================================================

  const editProduct = (product) => {
    if (!user) {
      Alert.alert(
        "Admin",
        "Please pehle admin login karein."
      );

      return;
    }

    Alert.prompt(
      "Edit Product Name",
      "Product name:",
      async (newName) => {
        if (!newName || !newName.trim()) {
          return;
        }

        Alert.prompt(
          "Edit Price",
          "Price per kg:",
          async (newPriceText) => {
            const newPrice =
              Number(newPriceText);

            if (!newPrice || newPrice <= 0) {
              Alert.alert(
                "Price",
                "Valid price enter karein."
              );

              return;
            }

            try {
              await update(
                ref(
                  database,
                  "products/" + product.id
                ),
                {
                  name: newName.trim(),
                  price: newPrice,
                }
              );

              Alert.alert(
                "Success",
                "Product update ho gaya."
              );
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Error",
                "Product update nahi ho saka."
              );
            }
          },
          "plain-text",
          String(product.price)
        );
      },
      "plain-text",
      product.name
    );
  };

  // ====================================================
  // DELETE PRODUCT
  // ====================================================

  const deleteProduct = (product) => {
    if (!user) {
      Alert.alert(
        "Admin",
        "Please pehle admin login karein."
      );

      return;
    }

    Alert.alert(
      "Delete Product",
      "Kya aap " +
        product.name +
        " delete karna chahte hain?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await remove(
                ref(
                  database,
                  "products/" + product.id
                )
              );

              Alert.alert(
                "Deleted",
                "Product delete ho gaya."
              );
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Error",
                "Product delete nahi ho saka."
              );
            }
          },
        },
      ]
    );
  };

  // ====================================================
  // CHANGE WHATSAPP NUMBER
  // ====================================================

  const changeWhatsAppNumber = () => {
    if (!user) {
      return;
    }

    Alert.prompt(
      "WhatsApp Number",
      "WhatsApp number country code ke sath enter karein.\nExample: 923363299194",
      async (newNumber) => {
        if (!newNumber || !newNumber.trim()) {
          return;
        }

        const cleanNumber =
          newNumber
            .replace(/\s/g, "")
            .replace(/^\+/, "");

        try {
          await update(
            ref(database, "settings"),
            {
              whatsappNumber: cleanNumber,
            }
          );

          Alert.alert(
            "Success",
            "WhatsApp number change ho gaya."
          );
        } catch (error) {
          console.log(error);

          Alert.alert(
            "Error",
            "WhatsApp number update nahi ho saka."
          );
        }
      },
      "plain-text",
      settings.whatsappNumber
    );
  };

  // ====================================================
  // CHANGE CALL NUMBER
  // ====================================================

  const changeCallNumber = () => {
    if (!user) {
      return;
    }

    Alert.prompt(
      "Call Number",
      "Call number enter karein.\nExample: +923363299194",
      async (newNumber) => {
        if (!newNumber || !newNumber.trim()) {
          return;
        }

        try {
          await update(
            ref(database, "settings"),
            {
              callNumber: newNumber.trim(),
            }
          );

          Alert.alert(
            "Success",
            "Call number change ho gaya."
          );
        } catch (error) {
          console.log(error);

          Alert.alert(
            "Error",
            "Call number update nahi ho saka."
          );
        }
      },
      "plain-text",
      settings.callNumber
    );
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>
          Loading Rizwee Brother Chicken Shop...
        </Text>
      </View>
    );
  }

  // ====================================================
  // ADMIN SCREEN
  // ====================================================

  if (adminMode) {
    return (
      <View style={styles.main}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
        >
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle}>
              🔐 ADMIN PANEL
            </Text>

            <Text style={styles.adminSubtitle}>
              Rizwee Brother Chicken Shop
            </Text>
          </View>

          {/* Products Management */}

          <Text style={styles.sectionTitle}>
            🛒 Product Management
          </Text>

          {products.map((product) => (
            <View
              style={styles.adminProductCard}
              key={product.id}
            >
              <View style={styles.adminProductInfo}>
                <Text style={styles.adminProductName}>
                  {product.name}
                </Text>

                <Text style={styles.adminProductPrice}>
                  Rs. {product.price}/kg
                </Text>
              </View>

              <View style={styles.adminButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    editProduct(product)
                  }
                >
                  <Text style={styles.adminButtonText}>
                    ✏️ EDIT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    deleteProduct(product)
                  }
                >
                  <Text style={styles.adminButtonText}>
                    🗑️ DELETE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Product */}

          <View style={styles.adminBox}>
            <Text style={styles.adminBoxTitle}>
              ➕ Add New Product
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              placeholderTextColor="#777"
              value={newProductName}
              onChangeText={setNewProductName}
            />

            <TextInput
              style={styles.input}
              placeholder="Price per kg"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={newProductPrice}
              onChangeText={setNewProductPrice}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addProduct}
            >
              <Text style={styles.saveButtonText}>
                💾 ADD PRODUCT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Settings */}

          <Text style={styles.sectionTitle}>
            ⚙️ Shop Settings
          </Text>

          <View style={styles.adminBox}>
            <Text style={styles.settingLabel}>
              WhatsApp Number
            </Text>

            <Text style={styles.settingValue}>
              {settings.whatsappNumber}
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={changeWhatsAppNumber}
            >
              <Text style={styles.saveButtonText}>
                📱 CHANGE WHATSAPP NUMBER
              </Text>
            </TouchableOpacity>

            <Text style={styles.settingLabel}>
              Call Number
            </Text>

            <Text style={styles.settingValue}>
              {settings.callNumber}
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={changeCallNumber}
            >
              <Text style={styles.saveButtonText}>
                📞 CHANGE CALL NUMBER
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={adminLogout}
          >
            <Text style={styles.logoutText}>
              🚪 ADMIN LOGOUT
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ====================================================
  // MAIN CUSTOMER SCREEN
  // ====================================================

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
                  changeQuantity(product.id, -1)
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
                  changeQuantity(product.id, 1)
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
            Total Weight: {totalWeight} / {MAX_WEIGHT} kg
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

        {/* Admin Login */}

        <View style={styles.adminLoginBox}>
          <Text style={styles.adminLoginTitle}>
            🔐 Shop Admin
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={adminEmail}
            onChangeText={setAdminEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Password"
            placeholderTextColor="#777"
            secureTextEntry
            value={adminPassword}
            onChangeText={setAdminPassword}
          />

          <TouchableOpacity
            style={styles.adminLoginButton}
            onPress={adminLogin}
          >
            <Text style={styles.adminLoginText}>
              🔑 ADMIN LOGIN
            </Text>
          </TouchableOpacity>
        </View>

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

// ======================================================
// STYLES
// ======================================================

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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },

  loadingText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
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

  adminLoginBox: {
    backgroundColor: "#eeeeee",
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
  },

  adminLoginTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 15,
  },

  adminLoginButton: {
    backgroundColor: "#6a1b9a",
    borderRadius: 17,
    padding: 18,
    alignItems: "center",
  },

  adminLoginText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  adminHeader: {
    backgroundColor: "#263238",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
  },

  adminTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },

  adminSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 8,
  },

  adminProductCard: {
    backgroundColor: "#f4f4f4",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  adminProductInfo: {
    marginBottom: 14,
  },

  adminProductName: {
    fontSize: 22,
    fontWeight: "900",
  },

  adminProductPrice: {
    fontSize: 19,
    color: "#c62828",
    fontWeight: "700",
    marginTop: 5,
  },

  adminButtons: {
    flexDirection: "row",
    gap: 10,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#1976d2",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#c62828",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },

  adminButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  adminBox: {
    backgroundColor: "#eeeeee",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  adminBoxTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 15,
  },

  saveButton: {
    backgroundColor: "#0f6b3a",
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
    marginBottom: 15,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  settingLabel: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },

  settingValue: {
    fontSize: 19,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 12,
  },

  logoutButton: {
    backgroundColor: "#b71c1c",
    borderRadius: 17,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  logoutText: {
    color: "#ffffff",
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
