import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export const findImage = (id: string): ImagePlaceholder | undefined => {
    return PlaceHolderImages.find(image => image.id === id);
};
