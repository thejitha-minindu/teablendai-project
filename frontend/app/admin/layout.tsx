"use client";
import '../globals.css';

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/admincomponents/layout/AdminSidebar';


export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-white text-black">
					<SidebarProvider>
					<AdminSidebar />
					<div className="p-0 w-full min-h-screen">
						<main className="p-6">{children}</main>
					</div>
				</SidebarProvider>
			</body>
		</html>
	);
}