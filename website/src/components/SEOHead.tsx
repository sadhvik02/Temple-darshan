import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
}

export default function SEOHead({
  title = "Sri Kedareshwara Ashramam",
  description = "A sacred space for devotion, peace, and spiritual connection. Explore Ashrama Sevas, Arjita Sevas, Darshan timings, spiritual donations, upcoming events, and news.",
}: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes("Sri Kedareshwara Ashramam")
      ? title
      : `${title} | Sri Kedareshwara Ashramam`;

    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);
  }, [title, description]);

  return null;
}
