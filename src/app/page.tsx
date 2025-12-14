
// This is a Server Component.
// It runs on the server to generate the initial HTML for the page.
// This makes the initial page load very fast.
import { MainContent } from "@/components/MainContent";

export default function Home() {
  return <MainContent />;
}
