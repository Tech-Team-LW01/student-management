import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

async function initializeEmailVerificationSetting() {
  try {
    console.log("Initializing email verification setting...");
    
    // Check if the setting already exists
    const docRef = doc(db, "settings", "app");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Email verification setting already exists:", docSnap.data().requireEmailVerification);
      return;
    }
    
    // Set default value (true = require email verification)
    await setDoc(docRef, { requireEmailVerification: true });
    console.log("✅ Email verification setting initialized with default value: true");
    
  } catch (error) {
    console.error("❌ Error initializing email verification setting:", error);
  }
}

// Run the initialization
initializeEmailVerificationSetting(); 