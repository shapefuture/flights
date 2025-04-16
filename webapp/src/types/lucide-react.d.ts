declare module 'lucide-react' {
  import React from 'react';
  
  export type IconProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  };
  
  export type Icon = React.FC<IconProps>;

  // Common icons used in the application
  export const LogOut: Icon;
  export const User: Icon;
  export const Settings: Icon;
  export const CreditCard: Icon;
  export const Mail: Icon;
  export const Lock: Icon;
  export const ChevronDown: Icon;
  export const UserPlus: Icon;
  export const Calendar: Icon;
  export const ArrowRight: Icon;
  export const Check: Icon;
  export const AlertCircle: Icon;
  export const ChevronUp: Icon;
  export const Loader2: Icon;
  export const Home: Icon;
  export const Search: Icon;
  export const Menu: Icon;
  export const Bell: Icon;
  export const Globe: Icon;
  export const Phone: Icon;
  export const Sun: Icon;
  export const Moon: Icon;
  export const DollarSign: Icon;
  export const CreditCard: Icon;
  export const Plane: Icon;
  export const Filter: Icon;
  export const X: Icon;
  export const Info: Icon;
  export const Send: Icon;
  export const Download: Icon;
  export const Upload: Icon;
  export const PlusCircle: Icon;
  export const MinusCircle: Icon;
}