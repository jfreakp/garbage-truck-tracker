import { redirect } from "next/navigation";

// Root is the map page (inside the (app) route group)
// The (app) layout handles auth redirect
export default function RootPage() {
  redirect("/map");
}
