'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

type BucketListItem = {
  id: string;
  type: 'location' | 'event';
};

type BucketListContextType = {
  bucketList: BucketListItem[];
  toggleBucketList: (id: string, type: 'location' | 'event') => void;
  isInBucketList: (id:string) => boolean;
};

const BucketListContext = createContext<BucketListContextType | undefined>(undefined);

export function BucketListProvider({ children }: { children: ReactNode }) {
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);

  const toggleBucketList = (id: string, type: 'location' | 'event') => {
    setBucketList((prevList) => {
      const existingIndex = prevList.findIndex(item => item.id === id);
      if (existingIndex > -1) {
        // Remove item
        return prevList.filter(item => item.id !== id);
      } else {
        // Add item
        return [...prevList, { id, type }];
      }
    });
  };

  const isInBucketList = (id: string) => {
    return bucketList.some(item => item.id === id);
  }

  return (
    <BucketListContext.Provider value={{ bucketList, toggleBucketList, isInBucketList }}>
      {children}
    </BucketListContext.Provider>
  );
}

export function useBucketList() {
  const context = useContext(BucketListContext);
  if (context === undefined) {
    throw new Error('useBucketList must be used within a BucketListProvider');
  }
  return context;
}
