"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, X, SlidersHorizontal, Filter } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";

export interface FilterSortProps {
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sortBy: string) => void;
  initialFilters?: Partial<FilterState>;
  initialSort?: string;
}

export interface FilterState {
  searchQuery: string;
  grade?: string;
}

const GRADE_OPTIONS = [
  { value: "all", label: "All Grades" },
  { value: "BOP", label: "BOP" },
  { value: "BOPF", label: "BOPF" },
  { value: "OP", label: "OP" },
  { value: "OP1", label: "OP1" },
  { value: "OPA", label: "OPA" },
  { value: "FBOP", label: "FBOP" },
  { value: "Pekoe", label: "Pekoe" },
  { value: "Pekoe 1", label: "Pekoe 1" },
  { value: "Dust", label: "Dust" },
  { value: "Dust 1", label: "Dust 1" },
  { value: "Silver Tips", label: "Silver Tips" },
  { value: "Golden Tips", label: "Golden Tips" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "grade", label: "Grade" },
  { value: "name", label: "Name" },
];

export function HistoryFilterSort({
  onFilterChange,
  onSortChange,
  initialFilters = {},
  initialSort = "recent",
}: FilterSortProps) {
  const [searchQuery, setSearchQuery] = useState(
    initialFilters.searchQuery || ""
  );
  const [grade, setGrade] = useState<string>(initialFilters.grade || "all");
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce search to avoid too many re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery !== initialFilters.searchQuery) {
      handleFilterApply();
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (grade !== initialFilters.grade) {
      handleFilterApply();
    }
  }, [grade]);

  const handleFilterApply = useCallback(() => {
    const filters: FilterState = {
      searchQuery: debouncedSearchQuery,
      grade: grade !== "all" ? grade : undefined,
    };
    onFilterChange?.(filters);
    setIsMobileFiltersOpen(false);
  }, [debouncedSearchQuery, grade, onFilterChange]);

  const handleSortChange = useCallback(
    (value: string) => {
      setSortBy(value);
      onSortChange?.(value);
    },
    [onSortChange]
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setGrade("all");
    setSortBy("recent");
    onFilterChange?.({
      searchQuery: "",
    });
    onSortChange?.("recent");
  }, [onFilterChange, onSortChange]);

  const activeFiltersCount = [searchQuery, grade !== "all"].filter(
    Boolean
  ).length;

  const clearSearch = () => setSearchQuery("");
  const clearGrade = () => setGrade("all");

  const renderMobileFilters = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Grade</label>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger>
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
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
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

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleResetFilters}
          variant="outline"
          className="flex-1"
        >
          Reset
        </Button>
        <Button onClick={handleFilterApply} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
      {/* Mobile Header with Filter Button */}
      <div className="md:hidden mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Filters</h3>
            {activeFiltersCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeFiltersCount} active filter
                {activeFiltersCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Sheet
            open={isMobileFiltersOpen}
            onOpenChange={setIsMobileFiltersOpen}
          >
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters & Sorting</SheetTitle>
              </SheetHeader>
              {renderMobileFilters()}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-6">
          {/* First Row - Search and Sort */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Search - Takes more space on large screens */}
            <div className="lg:col-span-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search Auctions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by auction ID, grade, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Grade Filter */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium text-foreground mb-2 block">
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

            {/* Sort */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium text-foreground mb-2 block">
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

          {/* Action Buttons and Active Filters */}
          <div className="flex flex-col gap-4">
            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Active filters ({activeFiltersCount})
                  </span>
                  <Button
                    onClick={handleResetFilters}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer hover:bg-muted transition-colors"
                      onClick={clearSearch}
                    >
                      Search: "
                      {searchQuery.length > 20
                        ? `${searchQuery.substring(0, 20)}...`
                        : searchQuery}
                      "
                      <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {grade !== "all" && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer hover:bg-muted transition-colors"
                      onClick={clearGrade}
                    >
                      {GRADE_OPTIONS.find((g) => g.value === grade)?.label}
                      <X className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {activeFiltersCount > 0 ? (
                  <span>
                    Filters applied. Results will update automatically.
                  </span>
                ) : (
                  <span>No filters applied. Showing all results.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="h-10"
                  >
                    Reset Filters
                  </Button>
                )}
                <Button
                  onClick={handleFilterApply}
                  className="flex-1 h-11 cursor-pointer hover:scale-98 transition-transform"
                  style={{ backgroundColor: "var(--color4)" }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Active Filters (outside sheet) */}
      {activeFiltersCount > 0 && (
        <div className="md:hidden flex flex-col gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active Filters</span>
            <Button
              onClick={handleResetFilters}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                {searchQuery.length > 15
                  ? `${searchQuery.substring(0, 15)}...`
                  : searchQuery}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {grade !== "all" && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={() => setGrade("all")}
              >
                {GRADE_OPTIONS.find((g) => g.value === grade)?.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
