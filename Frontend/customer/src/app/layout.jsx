import '../index.css';

export const metadata = {
  metadataBase: new URL('https://apexservicesondemand.netlify.app'),
  title: 'ApexServices - Certified Home Services & Craftsmanship',
  description: 'Book certified master technicians for emergency plumbing, electrical, carpentry, HVAC, and premium home maintenance with upfront pricing and verified warranties.',
  keywords: 'home services, certified electricians, emergency plumbing, carpentry, appliance repair, HVAC, technician booking',
  openGraph: {
    type: 'website',
    url: 'https://apexservicesondemand.netlify.app/',
    title: 'ApexServices - Certified Home Services & Craftsmanship',
    description: 'Certified master technicians for premium home repairs, electrical, plumbing, and carpentry. Upfront pricing & guaranteed service.',
    images: ['/favicon.svg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApexServices - Certified Home Services & Craftsmanship',
    description: 'Certified master technicians for premium home repairs, electrical, plumbing, and carpentry.',
    images: ['/favicon.svg']
  }
};

export const viewport = {
  themeColor: '#8f9ca9',
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
