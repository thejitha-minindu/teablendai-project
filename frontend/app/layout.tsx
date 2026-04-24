import './globals.css'
import { UserProvider } from '@/contexts/UserContext'

export const metadata = {
	title: 'TeaBlendAI',
	description: 'TeaBlendAI frontend',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-white text-black">
				<UserProvider>
					{children}
				</UserProvider>
			</body>
		</html>
	)
}