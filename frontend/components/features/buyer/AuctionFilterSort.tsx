"use client";
import { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FilterSortProps {
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sortBy: string) => void;
}

export interface FilterState {
  searchQuery: string;
  priceMin?: number;
  priceMax?: number;
  grade?: string;
  status?: string;
}

const GRADE_OPTIONS = [
  { value: "all", label: "All Grades" },
  { value: "A", label: "Premium (FTGFOP1, SFTGFOP, Silver Needle)" },
  { value: "B", label: "Standard (BOP, OP, FBOP, TGFOP)" },
  { value: "C", label: "Specialty (Herbal)" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "history", label: "History" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "ending-soon", label: "Ending Soon" },
];

export function AuctionFilterSort({
  onFilterChange,
  onSortChange,
}: FilterSortProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [grade, setGrade] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleFilterApply = () => {
    const filters: FilterState = {
      searchQuery,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      grade: grade !== "all" ? grade : undefined,
      status: status !== "all" ? status : undefined,
    };
    onFilterChange?.(filters);
    setIsMobileFiltersOpen(false);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriceMin("");
    setPriceMax("");
    setGrade("all");
    setStatus("all");
    setSortBy("recent");
    onFilterChange?.({
      searchQuery: "",
    });
    onSortChange?.("recent");
  };

  const activeFiltersCount = [
    searchQuery,
    priceMin,
    priceMax,
    grade !== "all",
    status !== "all",
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-4">
          {/* First Row - Search and Sort */}
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Search Auctions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by auction ID or grade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row - Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Grade
              </label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Min Price
              </label>
              <Input
                placeholder="Min"
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Max Price
              </label>
              <Input
                placeholder="Max"
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleFilterApply}
                className="flex-1 h-11 cursor-pointer hover:scale-98 transition-transform"
                style={{ backgroundColor: "var(--color4)" }}
              >
                Apply
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="h-11"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground font-medium">
                Active filters:
              </span>
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSearchQuery("")}
                >
                  {searchQuery} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {grade !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setGrade("all")}
                >
                  {GRADE_OPTIONS.find((g) => g.value === grade)?.label}{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {status !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setStatus("all")}
                >
                  {STATUS_OPTIONS.find((s) => s.value === status)?.label}{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {priceMin && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setPriceMin("")}
                >
                  Min: ${priceMin} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {priceMax && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setPriceMax("")}
                >
                  Max: ${priceMax} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Toggle */}
          <Button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            variant="outline"
            className="w-full h-11"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Expandable Filters */}
          {isMobileFiltersOpen && (
            <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Grade
                </label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Min Price
                  </label>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Max Price
                  </label>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleFilterApply}
                  className="flex-1 h-11"
                >
                  Apply
                </Button>
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => setSearchQuery("")}
                >
                  {searchQuery.substring(0, 10)}...{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {grade !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => setGrade("all")}
                >
                  {GRADE_OPTIONS.find((g) => g.value === grade)?.label}{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {status !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => setStatus("all")}
                >
                  {STATUS_OPTIONS.find((s) => s.value === status)?.label}{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
