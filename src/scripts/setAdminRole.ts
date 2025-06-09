import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wifxignbduaxgtberblz.supabase.co", // reemplazá por tu URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZnhpZ25iZHVheGd0YmVyYmx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODcwNjYxOSwiZXhwIjoyMDY0MjgyNjE5fQ.scTvQi4H3iXFacuZl6GcxEgNXD3fvfCnrYjPHHOLx3I" // ⚠️ clave secreta desde Supabase > Settings > API
);

async function setAdminRole() {
  const userId = "07511f2b-968f-430d-b299-ad0e08572f2e"; // Copialo desde Supabase > Auth > Users

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: "admin" },
  });

  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log("✅ Usuario ahora es admin:", data.user?.email);
  }
}

setAdminRole();
