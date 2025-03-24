module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        typography: ({ theme }) => ({
          DEFAULT: {
            css: {
              '--tw-prose-body': theme('colors.gray.800'),
              '--tw-prose-headings': theme('colors.gray.900'),
              '--tw-prose-links': theme('colors.blue.600'),
              table: {
                width: '100%',
                borderCollapse: 'collapse',
                margin: '1rem 0'
              },
              'td, th': {
                padding: '0.5rem',
                border: '1px solid #e5e7eb'
              },
              th: {
                backgroundColor: '#f3f4f6'
              }
            }
          }
        })
      }
    },
    plugins: [
      require('@tailwindcss/typography')
    ]
  }