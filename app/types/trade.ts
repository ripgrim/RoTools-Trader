export interface TradeItem {
  id: number;
  name: string;
  assetType: string;
  thumbnail: string;
  rap: number | string | null;
  value: number | string | null;
  serial?: string | null;
}

export interface Trade {
  id: number;
  user: {
    id: number;
    name: string;
    displayName: string;
    avatar: string;
  };
  status: 'Inbound' | 'Outbound' | 'Completed' | 'Declined' | 'Open';
  items: {
    offering: TradeItem[];
    requesting: TradeItem[];
  };
  created: string;
  expiration?: string;
  isActive?: boolean;
}