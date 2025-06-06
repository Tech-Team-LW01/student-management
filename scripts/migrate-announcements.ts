import { db } from "@/lib/firebase"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"

async function migrateAnnouncements() {
  try {
    console.log("Starting announcement migration...")
    
    // Get all announcements
    const announcementsSnapshot = await getDocs(collection(db, "announcements"))
    const announcements = announcementsSnapshot.docs
    
    console.log(`Found ${announcements.length} announcements to migrate`)
    
    // Update each announcement
    for (const announcementDoc of announcements) {
      const data = announcementDoc.data()
      
      // Skip if already migrated
      if (data.groupIds) {
        console.log(`Skipping announcement ${announcementDoc.id} - already migrated`)
        continue
      }
      
      // Convert groupId to groupIds array
      if (data.groupId) {
        console.log(`Migrating announcement ${announcementDoc.id}`)
        await updateDoc(doc(db, "announcements", announcementDoc.id), {
          groupIds: [data.groupId],
          // Remove old field
          groupId: null
        })
        console.log(`Successfully migrated announcement ${announcementDoc.id}`)
      }
    }
    
    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Error during migration:", error)
    throw error
  }
}

// Run the migration
migrateAnnouncements()
  .then(() => {
    console.log("Migration script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration script failed:", error)
    process.exit(1)
  }) 