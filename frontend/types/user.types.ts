export interface User {
  user_id: string;
  email: string;
  phone_num: string;
  user_name: string;
  first_name: string;
  last_name: string;
  default_role: 'buyer' | 'seller';
  profile_image_url?: string;
  financial_details: FinancialDetails; //  for better structure
  watch_list: string[];
}



export interface FinancialDetails {
  bank_name: string;
  account_num: string;
  branch_name: string;
  account_holder_name: string;
}

export interface Admin {
  admin_id: string;
  user_name: string;
  email: string;
  phone_num: string;
  first_name: string;
  last_name: string;
}