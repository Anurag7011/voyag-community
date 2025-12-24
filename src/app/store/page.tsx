
'use client';

import { useState, useMemo } from 'react';
import { type Product } from '@/lib/types';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductFilterSidebar } from '@/components/store/ProductFilterSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { getProductsCollectionRef } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc';

export default function StorePage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => getProductsCollectionRef(firestore), [firestore]);
  const { data: allProducts, isLoading } = useCollection<Product>(productsQuery);

  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: [0, 1000] as [number, number],
    rating: 0,
  });
  const [sort, setSort] = useState<SortOption>('relevance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    if (isLoading || !allProducts) return [];

    let filtered = allProducts.filter(product => {
      const categoryMatch = filters.categories.length === 0 || filters.categories.includes(product.category);
      const brandMatch = filters.brands.length === 0 || filters.brands.includes(product.brand);
      const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const ratingMatch = product.rating >= filters.rating;
      return categoryMatch && brandMatch && priceMatch && ratingMatch;
    });

    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default: // 'relevance'
        break;
    }

    return filtered;
  }, [allProducts, filters, sort, isLoading]);

  const uniqueCategories = useMemo(() => {
    if (isLoading || !allProducts) return [];
    return Array.from(new Set(allProducts.map(p => p.category)))
  }, [allProducts, isLoading]);

  const uniqueBrands = useMemo(() => {
    if (isLoading || !allProducts) return [];
    return Array.from(new Set(allProducts.map(p => p.brand)))
  }, [allProducts, isLoading]);


  const sidebarContent = (
    <ProductFilterSidebar
      filters={filters}
      setFilters={setFilters}
      uniqueCategories={uniqueCategories}
      uniqueBrands={uniqueBrands}
    />
  );

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">VOYAĠ Store</h1>
        <p className="text-muted-foreground mt-2">
          Curated gear for the modern traveller.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-1/4">
          {isLoading ? <FilterSidebarSkeleton /> : sidebarContent}
        </aside>

        <main className="flex-1">
          {/* Header with Sorting and Mobile Filter Trigger */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold">
              Products ({isLoading ? '...' : filteredAndSortedProducts.length})
            </h2>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    Sort by: {
                      {
                        'relevance': 'Relevance',
                        'price-asc': 'Price: Low to High',
                        'price-desc': 'Price: High to Low',
                        'rating-desc': 'Rating: High to Low'
                      }[sort]
                    }
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                    <DropdownMenuRadioItem value="relevance">Relevance</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-asc">Price: Low to High</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-desc">Price: High to Low</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rating-desc">Rating: High to Low</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Filter Button */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-4/5">
                   <div className="p-4 overflow-y-auto">
                    {isLoading ? <FilterSidebarSkeleton /> : sidebarContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
             <div className="text-center py-16">
              <p className="text-muted-foreground">No products match your filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[250px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

function FilterSidebarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
