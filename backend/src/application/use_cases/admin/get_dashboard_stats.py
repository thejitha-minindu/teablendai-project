class GetDashboardStatsUseCase:

    def __init__(self, repo):
        self.repo = repo

    def execute(self):

        total_auctions = self.repo.get_total_auctions()

        total_sellers = self.repo.get_total_sellers()
        total_buyers = self.repo.get_total_buyers()
        pending_sellers = self.repo.get_pending_sellers()
        pending_buyers = self.repo.get_pending_buyers()

        return {
            "total_auctions": total_auctions,
            "total_sellers": total_sellers,
            "total_buyers": total_buyers,
            "pending_sellers": pending_sellers,
            "pending_buyers": pending_buyers,
        }