export interface RestaurantSummary {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
  suspended: boolean;
}
