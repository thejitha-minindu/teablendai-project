import React from 'react'
import AuctionPreview from '@/components/features/buyer/AuctionPreview'
import AuctionPreviewCard from '@/components/features/buyer/AuctionPreviewCard'
import AnalyticsDashboardPreview from '@/components/features/buyer/AnalyticsDashboardPreview'
import AuctionCalendar from '@/components/features/buyer/AuctionCalendar'

function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-4 overflow-auto">
      <div className="max-w-[1600px] mx-auto">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-10">
          {/* Left Column - Analytics and Calendar */}
          <div className="flex flex-col gap-4">
            {/* Analytics Dashboard */}
            <AnalyticsDashboardPreview 
              title="Sessions"
              subtitle="Monthly Tea Price\n(by Distric)"
            />
            
            {/* Calendar */}
            <AuctionCalendar />
          </div>

          {/* Right Column - Auction Preview and Cards */}
          <div className="flex flex-col gap-4">
            {/* Featured Auction Preview */}
            <AuctionPreview 
              auctionTitle="Auction 1" 
              company="TeaTera PVT LTD" 
              date="2024-11-10" 
              time="10:00 AM"
              estateName="Green Valley Estate"
              grade="BOPF"
              quantity="1000 kg"
              reservePrice="$5,000"
            />

            {/* Auction Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AuctionPreviewCard 
                auctionTitle="Auction 1" 
                company="TeaTera PVT LTD"
                description="This lot consists of high-quality tea offered for sale through open auction. Each lot includes details such as garden name, grade, quantity, and manufacture date."
                date="2024-11-10"
                time="10:00 AM"
              />
              <AuctionPreviewCard 
                auctionTitle="Auction 1" 
                company="TeaTera PVT LTD"
                description="This lot consists of high-quality tea offered for sale through open auction. Each lot includes details such as garden name, grade, quantity, and manufacture date."
                date="2024-11-10"
                time="10:00 AM"
              />
              <AuctionPreviewCard 
                auctionTitle="Auction 1" 
                company="TeaTera PVT LTD"
                description="This lot consists of high-quality tea offered for sale through open auction. Each lot includes details such as garden name, grade, quantity, and manufacture date."
                date="2024-11-10"
                time="10:00 AM"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard