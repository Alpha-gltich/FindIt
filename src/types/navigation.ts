export type Report = {
  id: string;
  user_id: string;
  type: 'lost' | 'found';
  item_name: string;
  description: string;
  category: string;
  location: string;
  photo_url: string | null;
  status: string;
  contact_info?: string | null;
  created_at: string;
};

export type RootStackParamList = {
  Home: undefined;
  ReportLost: undefined;
  ReportFound: undefined;
  Browse: undefined;
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  Detail: { report: Report };
  MyReports: undefined;
  EditReport: { report: Report };
  Privacy: undefined;
  Terms: undefined;
  DeleteAccount: undefined;
  AdminModeration: undefined;
  AdminAuditLog: undefined;
  AdminDeletionRequests: undefined;
};
