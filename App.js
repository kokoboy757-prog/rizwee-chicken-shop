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

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  onValue,
  ref,
  set,
} from "firebase/database";

import { auth, database } from "./firebase";

const DEFAULT_PRODUCTS = [
  { id: "whole_chicken", name: "Whole Chicken", price: 600 },
  { id: "chicken_breast", name: "Chicken Breast", price: 750 },
  { id: "chicken_leg", name: "Chicken Leg", price: 700 },
  { id: "chicken_wings", name: "Chicken Wings", price: 550 },
  { id: "chicken_thigh", name: "Chicken Thigh", price: 700 },
  { id: "boneless_chicken", name: "Boneless Chicken", price: 800 },
];

const DEFAULT_SETTINGS = {
  whatsappNumber: "923363299194",
  callNumber: "+923363299194",
  maxWeight: 50,
};

const ADMIN_UID = "vCG8IaUJl0WJjCsP2JsuJdoF0wk1";

export default function App() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [quantities, setQuantities] = useState({});

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [user, setUser] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(true);

  const [adminVisible, setAdminVisible] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [adminProducts, setAdminProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [adminCall, setAdminCall] = useState("");
  const [adminMaxWeight, setAdminMaxWeight] = useState("");

  // ----------------------------------------
  // Firebase Authentication
  // ----------------------------------------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingFirebase(false);

      if (
        currentUser &&
        currentUser.uid === ADMIN_UID
      ) {
        setAdminWhatsapp(settings.whatsappNumber);
        setAdminCall(settings.callNumber);
        setAdminMaxWeight(String(settings.maxWeight));
      }
    });

    return unsubscribe;
  }, []);

  // ----------------------------------------
  // Load Products from Firebase
  // ----------------------------------------

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts(DEFAULT_PRODUCTS);
        return;
      }

      const loadedProducts = Object.entries(data).map(
        ([id, value]) => ({
          id,
          name: value.name,
          price: Number(value.price) || 0,
        })
      );

      setProducts(loadedProducts);
    });

    return unsubscribe;
  }, []);

  // ----------------------------------------
  // Load Settings from Firebase
  // ----------------------------------------

  useEffect(() => {
    const settingsRef = ref(database, "settings");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const newSettings = {
        whatsappNumber:
          data.whatsappNumber ||
          DEFAULT_SETTINGS.whatsappNumber,

        callNumber:
          data.callNumber ||
          DEFAULT_SETTINGS.callNumber,

        maxWeight:
          Number(data.maxWeight) ||
          DEFAULT_SETTINGS.maxWeight,
      };

      setSettings(newSettings);

      setAdminWhatsapp(newSettings.whatsappNumber);
      setAdminCall(newSettings.callNumber);
      setAdminMaxWeight(
        String(newSettings.maxWeight)
      );
    });

    return unsubscribe;
  }, []);

  // ----------------------------------------
  // Prepare Quantities
  // ----------------------------------------

  useEffect(() => {
    setQuantities((previous) => {
      const updated = {};

      products.forEach((product) => {
        updated[product.id] =
          Number(previous[product.id] || 0);
      });

      return updated;
    });

    setAdminProducts(products);
  }, [products]);

  // ----------------------------------------
  // Totals
  // ----------------------------------------

  const totalWeight = products.reduce(
    (total, product) => {
      return (
        total +
        Number(quantities[product.id] || 0)
      );
    },
    0
  );

  const totalAmount = products.reduce(
    (total, product) => {
      return (
        total +
        Number(quantities[product.id] || 0) *
          Number(product.price || 0)
      );
    },
    0
  );

  // ----------------------------------------
  // Quantity
  // ----------------------------------------

  const changeQuantity = (
    productId,
    amount
  ) => {
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

      if (
        newTotalWeight >
        Number(settings.maxWeight)
      ) {
        Alert.alert(
          "Weight Limit",
          `Maximum order limit is ${settings.maxWeight} kg.`
        );

        return previous;
      }

      return {
        ...previous,
        [productId]: next,
      };
    });
  };

  const addToCart = (productId) => {
    changeQuantity(productId, 1);
  };

  // ----------------------------------------
  // Clear Order
  // ----------------------------------------

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

  // ----------------------------------------
  // WhatsApp
  // ----------------------------------------

  const openWhatsApp = async (message) => {
    const encodedMessage =
      encodeURIComponent(message);

    const number =
      String(settings.whatsappNumber)
        .replace(/\D/g, "");

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

  const requestLocation = () => {
    const message =
      "Assalam-o-Alaikum. Rizwee Brother Chicken Shop se order ke liye please apni LIVE LOCATION WhatsApp par share kar dein. JazakAllah Khair ❤️";

    openWhatsApp(message);
  };

  // ----------------------------------------
  // Send Order
  // ----------------------------------------

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

  // ----------------------------------------
  // Call Shop
  // ----------------------------------------

  const callShop = async () => {
    const phoneNumber =
      String(settings.callNumber).trim();

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

  // ----------------------------------------
  // ADMIN LOGIN
  // ----------------------------------------

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
      const credential =
        await signInWithEmailAndPassword(
          auth,
          adminEmail.trim(),
          adminPassword
        );

      if (
        credential.user.uid !== ADMIN_UID
      ) {
        await signOut(auth);

        Alert.alert(
          "Access Denied",
          "Ye account admin nahi hai."
        );

        return;
      }

      setAdminPassword("");
      Alert.alert(
        "Success",
        "Admin login successful ✅"
      );
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Email ya password incorrect hai."
      );
    }
  };

  // ----------------------------------------
  // ADMIN LOGOUT
  // ----------------------------------------

  const adminLogout = async () => {
    try {
      await signOut(auth);
      setAdminVisible(false);
    } catch (error) {
      Alert.alert(
        "Error",
        "Logout nahi ho saka."
      );
    }
  };

  // ----------------------------------------
  // Save Settings
  // ----------------------------------------

  const saveSettings = async () => {
    if (!user || user.uid !== ADMIN_UID) {
      Alert.alert(
        "Access Denied",
        "Sirf admin settings change kar sakta hai."
      );
      return;
    }

    const cleanWhatsapp =
      adminWhatsapp.replace(/\D/g, "");

    const cleanCall =
      adminCall.trim();

    const maxWeight =
      Number(adminMaxWeight);

    if (!cleanWhatsapp) {
      Alert.alert(
        "WhatsApp",
        "WhatsApp number enter karein."
      );
      return;
    }

    if (!cleanCall) {
      Alert.alert(
        "Call",
        "Call number enter karein."
      );
      return;
    }

    if (!maxWeight || maxWeight <= 0) {
      Alert.alert(
        "Weight",
        "Valid maximum weight enter karein."
      );
      return;
    }

    try {
      await set(
        ref(database, "settings"),
        {
          whatsappNumber:
            cleanWhatsapp,

          callNumber:
            cleanCall,

          maxWeight:
            maxWeight,
        }
      );

      Alert.alert(
        "Saved",
        "Shop settings successfully update ho gayi hain ✅"
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Settings save nahi ho sakin."
      );
    }
  };

  // ----------------------------------------
  // Add Product
  // ----------------------------------------

  const addProduct = async () => {
    if (!user || user.uid !== ADMIN_UID) {
      return;
    }

    const name =
      newProductName.trim();

    const price =
      Number(newProductPrice);

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
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") +
      "_" +
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
        "Added",
        "Product successfully add ho gaya ✅"
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Product add nahi ho saka."
      );
    }
  };

  // ----------------------------------------
  // Edit Product
  // ----------------------------------------

  const editProduct = (
    product
  ) => {
    if (!user || user.uid !== ADMIN_UID) {
      return;
    }

    Alert.prompt(
      "Edit Product Name",
      "Product name:",
      async (newName) => {
        if (!newName || !newName.trim()) {
          return;
        }

        try {
          await set(
            ref(
              database,
              "products/" +
                product.id +
                "/name"
            ),
            newName.trim()
          );

          Alert.alert(
            "Saved",
            "Product name update ho gaya ✅"
          );
        } catch (error) {
          Alert.alert(
            "Error",
            "Product update nahi ho saka."
          );
        }
      },
      "plain-text",
      product.name
    );
  };

  // ----------------------------------------
  // Edit Price
  // ----------------------------------------

  const editPrice = (
    product
  ) => {
    if (!user || user.uid !== ADMIN_UID) {
      return;
    }

    Alert.prompt(
      "Edit Price",
      "Price per kg:",
      async (newPrice) => {
        const price =
          Number(newPrice);

        if (!price || price <= 0) {
          Alert.alert(
            "Price",
            "Valid price enter karein."
          );
          return;
        }

        try {
          await set(
            ref(
              database,
              "products/" +
                product.id +
                "/price"
            ),
            price
          );

          Alert.alert(
            "Saved",
            "Price update ho gaya ✅"
          );
        } catch (error) {
          Alert.alert(
            "Error",
            "Price update nahi ho saka."
          );
        }
      },
      "plain-text",
      String(product.price)
    );
  };

  // ----------------------------------------
  // Delete Product
  // ----------------------------------------

  const deleteProduct = (
    product
  ) => {
    if (!user || user.uid !== ADMIN_UID) {
      return;
    }

    Alert.alert(
      "Delete Product",
      `Kya aap "${product.name}" delete karna chahte hain?`,
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
              await set(
                ref(
                  database,
                  "products/" +
                    product.id
                ),
                null
              );

              Alert.alert(
                "Deleted",
                "Product delete ho gaya ✅"
              );
            } catch (error) {
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

  // ----------------------------------------
  // Initialize default products
  // ----------------------------------------

  const initializeProducts = async () => {
    if (!user || user.uid !== ADMIN_UID) {
      return;
    }

    try {
      const productObject = {};

      DEFAULT_PRODUCTS.forEach(
        (product) => {
          productObject[product.id] = {
            name: product.name,
            price: product.price,
          };
        }
      );

      await set(
        ref(database, "products"),
        productObject
      );

      Alert.alert(
        "Done",
        "Default products Firebase mein save ho gaye ✅"
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Products initialize nahi ho sake."
      );
    }
  };

  // ----------------------------------------
  // ADMIN SCREEN
  // ----------------------------------------

  const renderAdmin = () => {
    if (!adminVisible) {
      return null;
    }

    if (!user) {
      return (
        <View style={styles.adminCard}>
          <Text style={styles.adminTitle}>
            🔐 ADMIN LOGIN
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#777"
            autoCapitalize="none"
            keyboardType="email-address"
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
            <Text style={styles.adminButtonText}>
              🔐 LOGIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminCloseButton}
            onPress={() =>
              setAdminVisible(false)
            }
          >
            <Text style={styles.adminCloseText}>
              CLOSE
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (user.uid !== ADMIN_UID) {
      return null;
    }

    return (
      <View style={styles.adminCard}>
        <Text style={styles.adminTitle}>
          ⚙️ ADMIN PANEL
        </Text>

        <Text style={styles.adminSubtitle}>
          Product Management
        </Text>

        {adminProducts.map(
          (product) => (
            <View
              key={product.id}
              style={styles.adminProduct}
            >
              <View style={styles.adminProductInfo}>
                <Text
                  style={styles.adminProductName}
                >
                  {product.name}
                </Text>

                <Text
                  style={styles.adminProductPrice}
                >
                  Rs. {product.price}/kg
                </Text>
              </View>

              <View
                style={styles.adminProductButtons}
              >
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    editProduct(product)
                  }
                >
                  <Text style={styles.smallButtonText}>
                    NAME
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    editPrice(product)
                  }
                >
                  <Text style={styles.smallButtonText}>
                    PRICE
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    deleteProduct(product)
                  }
                >
                  <Text style={styles.smallButtonText}>
                    DELETE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        <Text style={styles.adminSubtitle}>
          Add New Product
        </Text>

        <TextInput
          style={styles.input}
          placeholder="New Product Name"
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
          style={styles.addProductButton}
          onPress={addProduct}
        >
          <Text style={styles.adminButtonText}>
            ➕ ADD PRODUCT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.initializeButton}
          onPress={initializeProducts}
        >
          <Text style={styles.adminButtonText}>
            🔄 RESTORE DEFAULT PRODUCTS
          </Text>
        </TouchableOpacity>

        <Text style={styles.adminSubtitle}>
          Shop Settings
        </Text>

        <TextInput
          style={styles.input}
          placeholder="WhatsApp Number"
          placeholderTextColor="#777"
          keyboardType="phone-pad"
          value={adminWhatsapp}
          onChangeText={setAdminWhatsapp}
        />

        <TextInput
          style={styles.input}
          placeholder="Call Number"
          placeholderTextColor="#777"
          keyboardType="phone-pad"
          value={adminCall}
          onChangeText={setAdminCall}
        />

        <TextInput
          style={styles.input}
          placeholder="Maximum Order Weight"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={adminMaxWeight}
          onChangeText={setAdminMaxWeight}
        />

        <TouchableOpacity
          style={styles.saveSettingsButton}
          onPress={saveSettings}
        >
          <Text style={styles.adminButtonText}>
            💾 SAVE SHOP SETTINGS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={adminLogout}
        >
          <Text style={styles.adminButtonText}>
            🔓 LOGOUT ADMIN
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ----------------------------------------
  // Loading
  // ----------------------------------------

  if (loadingFirebase) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>
          Loading Rizwee Brother Chicken Shop...
        </Text>
      </View>
    );
  }

  // ----------------------------------------
  // MAIN APP
  // ----------------------------------------

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

        {products.map(
          (product) => (
            <View
              style={styles.productCard}
              key={product.id}
            >
              <Text
                style={styles.productName}
              >
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
          )
        )}

        {/* Total */}

        <View style={styles.totalCard}>
          <Text style={styles.totalWeight}>
            Total Weight: {totalWeight} /{" "}
            {settings.maxWeight} kg
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

        {/* WhatsApp */}

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

        {/* Admin */}

        <TouchableOpacity
          style={styles.adminOpenButton}
          onPress={() =>
            setAdminVisible(true)
          }
        >
          <Text style={styles.adminOpenText}>
            ⚙️ ADMIN
          </Text>
        </TouchableOpacity>

        {/* Admin Panel */}

        {renderAdmin()}

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

// ----------------------------------------
// STYLES
// ----------------------------------------

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
    fontSize: 18,
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

  adminOpenButton: {
    backgroundColor: "#6a1b9a",
    borderRadius: 17,
    padding: 16,
    alignItems: "center",
    marginTop: 25,
  },

  adminOpenText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  adminCard: {
    backgroundColor: "#f3e5f5",
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#ce93d8",
  },

  adminTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#4a148c",
    textAlign: "center",
    marginBottom: 18,
  },

  adminSubtitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#4a148c",
    marginTop: 20,
    marginBottom: 12,
  },

  adminProduct: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
  },

  adminProductInfo: {
    marginBottom: 10,
  },

  adminProductName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111111",
  },

  adminProductPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: "#c62828",
    marginTop: 4,
  },

  adminProductButtons: {
    flexDirection: "row",
    gap: 6,
  },

  smallButton: {
    flex: 1,
    backgroundColor: "#222222",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#c62828",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  smallButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  adminLoginButton: {
    backgroundColor: "#6a1b9a",
    borderRadius: 15,
    padding: 17,
    alignItems: "center",
    marginTop: 5,
  },

  adminButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  adminCloseButton: {
    backgroundColor: "#777777",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },

  adminCloseText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  addProductButton: {
    backgroundColor: "#168a3a",
    borderRadius: 15,
    padding: 17,
    alignItems: "center",
  },

  initializeButton: {
    backgroundColor: "#1976d2",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },

  saveSettingsButton: {
    backgroundColor: "#0f6b3a",
    borderRadius: 15,
    padding: 17,
    alignItems: "center",
  },

  logoutButton: {
    backgroundColor: "#c62828",
    borderRadius: 15,
    padding: 17,
    alignItems: "center",
    marginTop: 12,
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
