'use client';

import { FreshchatProvider } from 'use-freshchat';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <FreshchatProvider
          token={process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN!}
          host="https://wchat.freshchat.com"
          debug={process.env.NODE_ENV === 'development'}
        >
          {children}
        </FreshchatProvider>
      </body>
    </html>
  );
}
