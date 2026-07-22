import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Falfoul — Store Manager",
    short_name: "Falfoul",
    description: "Manage products, invoices, stock, expiry and analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#d7e4e2",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
