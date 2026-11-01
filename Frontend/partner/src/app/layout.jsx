import '../index.css';

export const metadata = {
  metadataBase: new URL('https://apexservices-partner-portal.netlify.app'),
  title: 'ApexServices Partner Portal - Technician Field Operations',
  description: 'Enterprise partner workspace for certified home technicians. Claim dispatched jobs, manage earnings, and submit verification.',
};

export const viewport = {
  themeColor: '#0A2540',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
