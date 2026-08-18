import './globals.css'
import { UserProvider } from '@/contexts/UserContext'
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
	title: 'TeaBlendAI',
	description: 'TeaBlendAI frontend',
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/icon.png', sizes: '256x256', type: 'image/png' },
		],
		apple: [
			{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
		],
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="min-h-screen bg-white text-black">
				<UserProvider>
					{children}
					<Toaster />
				</UserProvider>
			</body>
		</html>
	)
}