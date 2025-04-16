// Type definitions for UI components
declare module '../ui/dropdown-menu' {
  import { ReactNode } from 'react';

  export interface DropdownMenuProps {
    children?: ReactNode;
    trigger?: ReactNode;
    align?: 'start' | 'end' | 'center';
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
  }

  export const DropdownMenu: React.FC<DropdownMenuProps>;
  export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children?: ReactNode }>;
  export const DropdownMenuContent: React.FC<{ className?: string; children?: ReactNode }>;
  export const DropdownMenuLabel: React.FC<{ className?: string; children?: ReactNode }>;
  export const DropdownMenuSeparator: React.FC<{ className?: string }>;
  export const DropdownMenuItem: React.FC<{ className?: string; children?: ReactNode; onSelect?: () => void }>;
}

declare module '../ui/avatar' {
  import { ReactNode } from 'react';

  export interface AvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    className?: string;
  }

  export const Avatar: React.FC<AvatarProps>;
  export const AvatarImage: React.FC<{ src?: string; alt?: string; className?: string }>;
  export const AvatarFallback: React.FC<{ children?: ReactNode; className?: string }>;
}

declare module '../ui/button' {
  import { ReactNode } from 'react';

  export interface ButtonProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    children?: ReactNode;
    asChild?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  }

  const Button: React.FC<ButtonProps>;
  export default Button;
  export { Button };
}

declare module '../ui/use-toast' {
  export interface ToastProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    variant?: 'default' | 'destructive';
    duration?: number;
  }

  export function useToast(): {
    toast: (props: ToastProps) => void;
    dismiss: (toastId?: string) => void;
  };
}

declare module '../ui/slider' {
  export interface SliderProps {
    defaultValue?: number[];
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number[]) => void;
    className?: string;
  }

  export const Slider: React.FC<SliderProps>;
}

declare module '../ui/switch' {
  export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
  }

  export const Switch: React.FC<SwitchProps>;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export const LogOut: ComponentType<SVGProps<SVGSVGElement>>;
  export const User: ComponentType<SVGProps<SVGSVGElement>>;
  export const Settings: ComponentType<SVGProps<SVGSVGElement>>;
  export const CreditCard: ComponentType<SVGProps<SVGSVGElement>>;
  export const Mail: ComponentType<SVGProps<SVGSVGElement>>;
  export const Lock: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChevronDown: ComponentType<SVGProps<SVGSVGElement>>;
  export const UserPlus: ComponentType<SVGProps<SVGSVGElement>>;
  export const Calendar: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowRight: ComponentType<SVGProps<SVGSVGElement>>;
  export const Check: ComponentType<SVGProps<SVGSVGElement>>;
}