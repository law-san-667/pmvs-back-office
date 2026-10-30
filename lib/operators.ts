export type OperatorBusiness = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  status: string;
};

export type OperatorAssignment = {
  id: string;
  operatorUserId: string;
  businessId: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  operator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  business?: OperatorBusiness;
};
