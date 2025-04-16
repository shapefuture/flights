import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Additional type definitions for missing modules
declare module 'lucide-react' {
  export const Loader2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const User: React.FC<React.SVGProps<SVGSVGElement>>;
  export const LogOut: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Settings: React.FC<React.SVGProps<SVGSVGElement>>;
  export const CreditCard: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Wallet: React.FC<React.SVGProps<SVGSVGElement>>;
  export const DollarSign: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Menu: React.FC<React.SVGProps<SVGSVGElement>>;
  // Add other icons as needed
}

// Add missing UI component module declarations
declare module '../components/ui/use-toast' {
  export const useToast: () => {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => void;
  };
}

declare module '../components/ui/dropdown-menu' {
  export const DropdownMenu: React.FC<React.PropsWithChildren<{}>>;
  export const DropdownMenuTrigger: React.FC<React.PropsWithChildren<{}>>;
  export const DropdownMenuContent: React.FC<React.PropsWithChildren<{}>>;
  export const DropdownMenuGroup: React.FC<React.PropsWithChildren<{}>>;
  export const DropdownMenuItem: React.FC<React.PropsWithChildren<{ className?: string }>>;
  export const DropdownMenuLabel: React.FC<React.PropsWithChildren<{ className?: string }>>;
  export const DropdownMenuSeparator: React.FC<React.PropsWithChildren<{}>>;
}

declare module '../components/ui/avatar' {
  export const Avatar: React.FC<React.PropsWithChildren<{}>>;
  export const AvatarImage: React.FC<{ src: string; alt: string; className?: string }>;
  export const AvatarFallback: React.FC<React.PropsWithChildren<{ className?: string }>>;
}

declare module '../components/ui/button' {
  export const Button: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; className?: string }
  >;
}

declare module '../components/ui/input' {
  export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
}

declare module '../components/ui/label' {
  export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>>;
}

declare module '../components/ui/checkbox' {
  export const Checkbox: React.FC<{
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }>;
}

declare module '../components/ui/switch' {
  export const Switch: React.FC<{
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }>;
}
