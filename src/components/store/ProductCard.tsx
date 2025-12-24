
'use client';

import Image from 'next/image';
import { type Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/shared/StarRating';
import { ShoppingCart } from 'lucide-react';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <Image
            src={product.media[0].url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            data-ai-hint={product.media[0].hint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <p className="text-sm font-semibold text-muted-foreground">{product.brand}</p>
        <h3 className="font-bold text-md flex-1">{product.name}</h3>
        <div className="mt-2">
           <StarRating rating={product.rating} showText={false} size={16} />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
        <Button variant="outline" size="icon">
          <ShoppingCart className="h-5 w-5"/>
          <span className="sr-only">Add to Cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
