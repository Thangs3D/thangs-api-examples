import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Thangs API",
  description: "Integration guide for the Thangs API",
  // Served from GitHub Pages at /<repo>/.
  base: "/thangs-api-examples/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      {
        text: "Samples",
        link: "https://github.com/Thangs3D/thangs-api-examples/tree/main/samples",
      },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Overview", link: "/" },
          { text: "Getting started", link: "/getting-started" },
          {
            text: "Plans and user memberships",
            link: "/plans-and-memberships",
          },
          { text: "Model management", link: "/model-management" },
        ],
      },
    ],
    outline: [2, 3],
    search: { provider: "local" },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Thangs3D/thangs-api-examples",
      },
    ],
    editLink: {
      pattern:
        "https://github.com/Thangs3D/thangs-api-examples/edit/main/docs/:path",
    },
  },
});
