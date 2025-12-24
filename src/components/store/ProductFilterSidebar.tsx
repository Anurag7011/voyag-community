'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { StarRatingInput } from '@/components/shared/StarRatingInput';
import { Dispatch, SetStateAction } from 'react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

type Filters = {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  rating: number;
};

type ProductFilterSidebarProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  uniqueCategories: string[];
  uniqueBrands: string[];
};

export function ProductFilterSidebar({
  filters,
  setFilters,
  uniqueCategories,
  uniqueBrands,
}: ProductFilterSidebarProps) {
  
  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleBrandChange = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handlePriceChange = (value: [number, number]) => {
    setFilters(prev => ({ ...prev, priceRange: value }));
  };

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({ ...prev, rating }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      rating: 0,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filters</CardTitle>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3">Category</h3>
          <div className="space-y-2">
            {uniqueCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label htmlFor={`cat-${category}`} className="font-normal">{category}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Brands */}
        <div>
          <h3 className="font-semibold mb-3">Brand</h3>
          <div className="space-y-2">
            {uniqueBrands.map(brand => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => handleBrandChange(brand)}
                />
                <Label htmlFor={`brand-${brand}`} className="font-normal">{brand}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />

        {/* Price Range */}
        <div>
          <h3 className="font-semibold mb-3">Price Range</h3>
          <Slider
            min={0}
            max={200}
            step={10}
            value={filters.priceRange}
            onValueChange={handlePriceChange}
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
        
        <Separator />

        {/* Rating */}
        <div>
          <h3 className="font-semibold mb-3">Rating</h3>
          <StarRatingInput rating={filters.rating} setRating={handleRatingChange} size={20} />
        </div>
      </CardContent>
    </Card>
  );
}
