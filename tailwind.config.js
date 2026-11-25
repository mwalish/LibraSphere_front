/** Colours are CSS variables so dark mode and high-contrast swap in one place (see index.css). */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Young Serif", "Georgia", "serif"],
        sans: ["Hanken Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        ground: c("ground"), surface: c("surface"), ink: c("ink"), muted: c("muted"), line: c("line"),
        primary: c("primary"), onprimary: c("onprimary"), plum: c("plum"),
        saffron: c("saffron"), teal: c("teal"), brick: c("brick"),
      },
    },
  },
  plugins: [],
};
