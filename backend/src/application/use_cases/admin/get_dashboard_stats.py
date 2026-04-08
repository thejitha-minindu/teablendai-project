class GetDashboardStatsUseCase:

    def __init__(self, repo):
        self.repo = repo

    def execute(self):

        total_auctions = self.repo.get_total_auctions()

        return {
            "total_auctions": total_auctions
        }