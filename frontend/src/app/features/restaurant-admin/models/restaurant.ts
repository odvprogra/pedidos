export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
  suspended: boolean;
}

export interface RestaurantRegistration {
  name: string;
  description: string;
  address: string;
}
