
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getProductsCollectionRef, getDeletionRequestsCollectionRef } from '@/lib/firestore';
import { type Product } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/product/ProductForm';
import { useState } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { serverTimestamp } from 'firebase/firestore';

export default function AdminProductsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isOwner } = useAdmin();

  const [reason, setReason] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const productsQuery = useMemoFirebase(
    () => getProductsCollectionRef(firestore),
    [firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const handleRequestDeletion = () => {
    if (!selectedProduct || !user || !reason) {
        toast({variant: "destructive", title: "Missing Information", description: "A reason is required to request deletion."})
        return;
    };
    
    const requestsCollectionRef = getDeletionRequestsCollectionRef(firestore);
    addDocumentNonBlocking(requestsCollectionRef, {
        targetId: selectedProduct.id,
        targetType: 'product',
        targetContent: selectedProduct,
        requesterId: user.uid,
        requesterName: user.displayName || 'Admin',
        reason: reason,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    
    toast({
        title: "Deletion Requested",
        description: "The owner has been notified to review your request.",
    });

    setIsRequestDialogOpen(false);
    setSelectedProduct(null);
    setReason('');
  };

  const openRequestDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsRequestDialogOpen(true);
  }

  return (
    <>
    <AdminNav />
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>
            Add, edit, or remove products from the VOYAĠ store.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add a New Product</DialogTitle>
              <DialogDescription>
                Fill out the details below to add a new product to the store.
              </DialogDescription>
            </DialogHeader>
            <ProductForm onSubmitted={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading products...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && products && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Avatar className="h-12 w-12 rounded-md">
                    <AvatarImage
                      src={product.media[0]?.url}
                      alt={product.name}
                    />
                    <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="icon" onClick={() => openRequestDialog(product)} disabled={isOwner}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
     <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Content Deletion</DialogTitle>
                <DialogDescription>
                    Provide a reason for deleting this content. This request will be sent to the app owner for approval.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                        Reason
                    </Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Content is inappropriate or spam."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRequestDeletion}>Request Deletion</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
