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
  offers?: TradeOffer[]
}


export type TradeOffer = {
  user: { id: number; name: string; displayName: string };
  userAssets: {
    id: number;
    serialNumber: number;
    assetId: number;
    name: string;
    recentAveragePrice: number;
    originalPrice: number;
    assetStock: number;
    membershipType: number;
  }[];
  robux: number;
}

export type TradeDetail = {
offers: TradeOffer[];
id: number;
user: { id: number; name: string; displayName: string };
created: string;
expiration: string;
isActive: boolean;
status: string;
};