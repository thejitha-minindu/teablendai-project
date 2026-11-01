"use client";
import '../globals.css';

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/admincomponents/layout/AdminSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';


export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-white text-black">
			<SidebarProvider>
				<ProtectedRoute requiredRole="admin">
					<AdminSidebar />
					<div className="min-w-0 flex-1 min-h-screen">
						<main className="px-4 pb-6 pt-20 sm:px-6 md:p-6">{children}</main>
					</div>
				</ProtectedRoute>
			</SidebarProvider>
		</div>
	);
}
