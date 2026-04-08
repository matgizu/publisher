import { MetadataRoute } from "next";
import { TOOLS_REGISTRY } from "@/lib/tools-registry";

const BASE_URL = "https://calcutools.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries = TOOLS_REGISTRY.map((tool) => ({
    url: `${BASE_URL}/${tool.slug}`,
    lastModified: new Date(tool.publicada),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/calculadoras`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/conversores`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/generadores`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...toolEntries,
  ];
}
