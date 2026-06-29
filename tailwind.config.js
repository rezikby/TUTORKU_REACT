/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Comprehensive breakpoints for all device sizes
      screens: {
        // Very small phones (280px - 320px)
        'xs': '280px',      // Samsung Galaxy Fold (Folded)
        'xs-sm': '320px',   // iPhone SE, iPhone 5
        
        // Small phones (360px - 390px)
        'sm': '360px',      // Samsung Galaxy S8-S24, Xiaomi, Oppo, Vivo, OnePlus, Motorola
        'sm-md': '375px',   // iPhone 6-11 Pro
        'sm-lg': '390px',   // iPhone 12-15
        
        // Medium phones (393px - 430px)
        'md': '393px',      // Google Pixel 4-8
        'md-lg': '402px',   // iPhone 16 series
        'md-xl': '412px',   // Google Pixel 6-8 Pro, Samsung S24/S25 Ultra
        'md-2xl': '414px',  // iPhone XR, iPhone 11, Plus models
        'md-3xl': '430px',  // iPhone 14/15/16 Plus/Pro Max
        
        // Large phones & landscape (480px+)
        'lg': '480px',      // Large Phone Landscape
        'lg-md': '540px',   // Large Android Phones
        
        // Small tablets (600px+)
        'lg-lg': '600px',   // Small Tablet / Foldable opened
        
        // Tablets (653px - 912px)
        'tablet': '653px',  // Galaxy Fold (Opened)
        'tablet-sm': '673px',  // Google Pixel Fold
        'tablet-md': '690px',  // Galaxy Z Fold 5/6
        'tablet-lg': '768px',  // iPad Mini
        'tablet-xl': '800px',  // Samsung Galaxy Tab A/S
        'tablet-2xl': '810px', // iPad (9th/10th Gen)
        'tablet-3xl': '820px', // iPad Air
        'tablet-4xl': '834px', // iPad Pro 11"
        'tablet-5xl': '853px', // Xiaomi Pad
        'tablet-6xl': '912px', // Microsoft Surface Go
        
        // Tablets landscape & small laptops (1024px+)
        'xl': '1024px',     // iPad Mini Landscape, Small Laptop
        'xl-sm': '1080px',  // iPad Landscape
        
        // Laptops (1152px+)
        'xl-md': '1152px',  // Chromebook
        'xl-lg': '1180px',  // iPad Air Landscape
        'xl-xl': '1194px',  // iPad Pro 11 Landscape
        'xl-2xl': '1280px', // MacBook Air 13", Laptop HD, Samsung Galaxy Tab Landscape
        'xl-3xl': '1360px', // Laptop HD+
        'xl-4xl': '1366px', // Laptop WXGA (Umum), WXGA Desktop
        'xl-5xl': '1400px', // ThinkPad
        '2xl': '1440px',    // MacBook Air M2, Laptop Full HD Scaling
        '2xl-sm': '1512px', // MacBook Pro 14"
        
        // Large desktops (1600px+)
        '2xl-md': '1600px', // MacBook Air 15", Wide Desktop
        '2xl-lg': '1680px', // WSXGA+
        '2xl-xl': '1728px', // MacBook Pro 16"
        '2xl-2xl': '1920px', // Full HD
        
        // Very large desktops (2048px+)
        '3xl': '2048px',    // 2K Retina
        '3xl-sm': '2560px', // QHD / 2K, 21:9 Ultrawide
        '3xl-md': '2880px', // 3K
        '3xl-lg': '3200px', // 3K+
        '3xl-xl': '3440px', // Ultrawide QHD
        '3xl-2xl': '3840px', // 4K UHD, Ultrawide WQHD+
        '3xl-3xl': '4096px', // DCI 4K
        '3xl-4xl': '5120px', // 5K, Super Ultrawide
        '3xl-5xl': '6016px', // Apple Pro Display XDR
        '3xl-6xl': '7680px', // 8K UHD, Dual 4K
      },
      
      // Responsive spacing adjustments
      spacing: {
        'gutter-xs': 'clamp(0.5rem, 2vw, 1rem)',
        'gutter-sm': 'clamp(1rem, 3vw, 1.5rem)',
        'gutter-md': 'clamp(1.5rem, 4vw, 2rem)',
        'gutter-lg': 'clamp(2rem, 5vw, 3rem)',
      },
      
      // Responsive font sizes
      fontSize: {
        'xs-clamp': 'clamp(0.6rem, 1.5vw, 0.75rem)',
        'sm-clamp': 'clamp(0.75rem, 2vw, 0.875rem)',
        'base-clamp': 'clamp(0.875rem, 2.5vw, 1rem)',
        'lg-clamp': 'clamp(1rem, 3vw, 1.125rem)',
        'xl-clamp': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        '2xl-clamp': 'clamp(1.5rem, 4vw, 1.5rem)',
        '3xl-clamp': 'clamp(1.875rem, 5vw, 1.875rem)',
      },
      
      // Container queries
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          'xs': '0.5rem',
          'xs-sm': '0.75rem',
          'sm': '1rem',
          'md': '1.5rem',
          'lg': '2rem',
          'xl': '2.5rem',
          '2xl': '3rem',
        },
      },
    },
  },
  plugins: [],
}
