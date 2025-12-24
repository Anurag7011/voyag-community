
import { z } from 'zod';

export const locationSchema = z.object({
  caption: z.string().min(10, 'Caption must be at least 10 characters long.'),
  country: z.string().min(2, 'Country is required.'),
  city: z.string().min(2, 'City or Town is required.'),
  hashtags: z.string().optional(),
  mapLink: z.string().url('Please enter a valid Google Maps URL.'),
  media: z.any().refine(files => files?.length > 0, 'An image or video is required.'),
  howToReach: z.string().optional(),
  whatToTake: z.string().optional(),
  entryFee: z.string().optional(),
});

export type LocationSchema = z.infer<typeof locationSchema>;

const ticketTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required.'),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().nonnegative('Price must be a non-negative number.')
  ),
});


export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  date: z.date({
    required_error: 'A date is required.',
  }),
  time: z.string().min(1, 'Time is required.'),
  place: z.string().min(3, 'Place is required.'),
  media: z.any().refine(files => files?.length > 0, 'An image or video is required.'),
  isFree: z.boolean().default(false),
  tickets: z.array(ticketTierSchema).optional(),
  paymentLink: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.isFree && data.tickets && data.tickets.length > 0) {
        if (!data.paymentLink || !z.string().url().safeParse(data.paymentLink).success) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['paymentLink'],
                message: 'A valid payment link is required for paid ticketed events.',
            });
        }
    }
});


export type EventSchema = z.infer<typeof eventSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Please select a rating." }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;


export const productSchema = z.object({
  name: z.string().min(3, 'Product name is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  brand: z.string().min(2, 'Brand is required.'),
  price: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().min(0, 'Price must be a positive number.')
  ),
  category: z.string().min(2, 'Category is required.'),
  media: z.any().refine(files => files?.length > 0, 'An image or video is required.'),
});

export type ProductSchema = z.infer<typeof productSchema>;

const cityGroupSchema = z.object({
  city: z.string().min(2, 'City name is required.'),
  whatsappLink: z.string().url('Must be a valid WhatsApp group URL.'),
});

export const groupSchema = z.object({
  country: z.string().min(2, 'Country name is required.'),
  id: z.string().min(2, 'Country ID/slug is required (e.g., "united-kingdom").').regex(/^[a-z0-9-]+$/, 'ID can only contain lowercase letters, numbers, and hyphens.'),
  flag: z.string().min(1, 'Flag emoji is required.'),
  image: z.any().refine(files => files?.length > 0, 'An image is required.'),
  groups: z.array(cityGroupSchema).min(1, 'At least one city group is required.'),
});

export type GroupSchema = z.infer<typeof groupSchema>;


export const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatarFile: z.any().optional(),
  dobDay: z.string().optional(),
  dobMonth: z.string().optional(),
  dobYear: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Do not wish to disclose']).optional(),
  travelInterests: z.array(z.string()).optional(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
