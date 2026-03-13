/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        border: "#d9d9e3",
        input: "#d9d9e3",
        ring: "#404080",
        background: "#f0f5f9",
        foreground: "#1a1f2e",
        primary: {
          DEFAULT: "#1a2140",
          foreground: "#e6c950",
        },
        secondary: {
          DEFAULT: "#c49c30",
          foreground: "#1a1f2e",
        },
        destructive: {
          DEFAULT: "#b3230f",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#ead6c3",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#c49c30",
          foreground: "#1a1f2e",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1a1f2e",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1f2e",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.625rem",
        sm: "0.375rem",
      },
    },
  },
}
