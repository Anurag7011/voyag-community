

export type User = {
  id: string; // The uid from Firebase Auth
  uid: string; // Sync with id
  displayName: string;
  username: string; // This should be required after initial setup
  email: string;
  avatarUrl: string;
  bio?: string;
  travelInterests?: string[];
  followers: number;
  following: number;
  isAdmin: boolean;
  createdAt: any; // Firestore Timestamp
  dob?: string;
  gender?: 'Male' | 'Female' | 'Do not wish to disclose';
  avatar: {
    imageUrl: string;
    imageHint: string;
  };
  name: string;
};

export type Review = {
  id: string;
  targetType: 'location' | 'event';
  targetId: string;
  reviewerId: string;
  reviewerUsername: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
  user: {
      avatar: {
          imageUrl: string;
          imageHint: string;
      },
      name: string;
  }
};

export type Media = {
  url: string;
  type: 'image' | 'video';
  hint: string;
  thumbnailUrl?: string; // Optional: for video thumbnails
};


export type Location = {
  id: string;
  caption: string;
  media: Media;
  country: string;
  city: string;
  hashtags: string[];
  mapLink: string;
  user: {
      id: string;
      name: string;
      avatar: {
          imageUrl: string;
          imageHint: string;
      }
  },
  reviews: Review[];
  likes: number;
  howToReach?: string;
  whatToTake?: string;
  entryFee?: string;
  createdAt: any; // Firestore Timestamp
};

export type Event = {
  id: string;
  title: string;
  media: Media;
  date: string;
  time: string;
  place: string;
  description: string;
  user: {
      id: string;
      name: string;
      avatar: {
          imageUrl: string;
          imageHint: string;
      }
  },
  reviews: Review[];
  likes: number;
  tickets?: { name: string; price: number }[];
  isFree?: boolean;
  paymentLink?: string;
  createdAt: any; // Firestore Timestamp
};

export type BucketListItem = {
    id: string;
    userId: string;
    itemType: 'location' | 'event';
    itemId: string;
    savedAt: any; // Firestore Timestamp
}

export type CityGroup = {
  city: string;
  whatsappLink: string;
};

export type CountryGroup = {
  id: string;
  country: string;
  flag: string;
  image: {
      imageUrl: string;
      imageHint: string;
  };
  groups: CityGroup[];
};

export type Product = {
  id:string;
  name:string;
  description:string;
  brand:string;
  price:number;
  rating:number;
  category:string;
  media:Media[];
};

export type DeletionRequest = {
    id: string;
    targetId: string;
    targetType: 'location' | 'event' | 'group' | 'product';
    targetContent: Location | Event | CountryGroup | Product;
    requesterId: string;
    requesterName: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore Timestamp
}
    

    
