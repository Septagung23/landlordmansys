export type NegotiationComment = {
  id: string;
  newPricePerYear: number;
  growth: number;
  note: string;
  editedAt: string;
  editedBy: string;
};

export type Site = {
  id: string;
  code: string;
  legacyCode: string;
  ll: string;
  negotiator: string;
  towerType: string;
  province: string;
  existingPricePerYear: number;
  newPricePerYear: number;
  contractEnd: string;
  coordinates: string;
  landlordAddress: string;
  contact: string;
  oldLeaseTime: number;
  newLeaseTime: number;
  negotiationComments: NegotiationComment[];
};
