// Type definitions for UI components
import { ReactNode, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Button Component
declare module '../components/ui/button' {
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }

  export const Button: React.FC<ButtonProps>;
}

// Avatar Component
declare module '../components/ui/avatar' {
  export interface AvatarProps {
    className?: string;
    children?: ReactNode;
  }

  export interface AvatarImageProps {
    className?: string;
    src?: string;
    alt?: string;
  }

  export interface AvatarFallbackProps {
    className?: string;
    children?: ReactNode;
    delayMs?: number;
  }

  export const Avatar: React.FC<AvatarProps>;
  export const AvatarImage: React.FC<AvatarImageProps>;
  export const AvatarFallback: React.FC<AvatarFallbackProps>;
}

// Dialog Component
declare module '../components/ui/dialog' {
  export interface DialogProps {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  }

  export interface DialogContentProps {
    children?: ReactNode;
    className?: string;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
    onFocusOutside?: (event: FocusEvent) => void;
    forceMount?: boolean;
  }

  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: React.FC<{ asChild?: boolean; children?: ReactNode }>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogHeader: React.FC<{ className?: string; children?: ReactNode }>;
  export const DialogFooter: React.FC<{ className?: string; children?: ReactNode }>;
  export const DialogTitle: React.FC<{ className?: string; children?: ReactNode }>;
  export const DialogDescription: React.FC<{ className?: string; children?: ReactNode }>;
}

// Dropdown Menu Component
declare module '../components/ui/dropdown-menu' {
  export interface DropdownMenuProps {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  }

  export interface DropdownMenuTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }

  export interface DropdownMenuContentProps {
    children?: ReactNode;
    className?: string;
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    alignOffset?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    forceMount?: boolean;
  }

  export interface DropdownMenuItemProps {
    children?: ReactNode;
    className?: string;
    onSelect?: () => void;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
  }

  export const DropdownMenu: React.FC<DropdownMenuProps>;
  export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps>;
  export const DropdownMenuContent: React.FC<DropdownMenuContentProps>;
  export const DropdownMenuLabel: React.FC<{ className?: string; children?: ReactNode }>;
  export const DropdownMenuSeparator: React.FC<{ className?: string }>;
  export const DropdownMenuItem: React.FC<DropdownMenuItemProps>;
  export const DropdownMenuGroup: React.FC<{ children?: ReactNode }>;
}

// Input Component
declare module '../components/ui/input' {
  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }

  export const Input: React.FC<InputProps>;
}

// Label Component
declare module '../components/ui/label' {
  export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
  }

  export const Label: React.FC<LabelProps>;
}

// Sheet Component
declare module '../components/ui/sheet' {
  export interface SheetProps {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  }

  export const Sheet: React.FC<SheetProps>;
  export const SheetTrigger: React.FC<{ asChild?: boolean; children?: ReactNode }>;
  export const SheetContent: React.FC<{ side?: 'top' | 'right' | 'bottom' | 'left'; className?: string; children?: ReactNode }>;
  export const SheetHeader: React.FC<{ className?: string; children?: ReactNode }>;
  export const SheetFooter: React.FC<{ className?: string; children?: ReactNode }>;
  export const SheetTitle: React.FC<{ className?: string; children?: ReactNode }>;
  export const SheetDescription: React.FC<{ className?: string; children?: ReactNode }>;
  export const SheetClose: React.FC<{ asChild?: boolean; children?: ReactNode }>;
}

// Select Component
declare module '../components/ui/select' {
  export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
  }

  export const Select: React.FC<SelectProps>;
  export const SelectValue: React.FC<{ placeholder?: string; children?: ReactNode }>;
  export const SelectTrigger: React.FC<{ className?: string; children?: ReactNode }>;
  export const SelectContent: React.FC<{ className?: string; children?: ReactNode }>;
  export const SelectItem: React.FC<{ value: string; className?: string; children?: ReactNode }>;
  export const SelectGroup: React.FC<{ className?: string; children?: ReactNode }>;
  export const SelectLabel: React.FC<{ className?: string; children?: ReactNode }>;
}

// Alert Component
declare module '../components/ui/alert' {
  export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
  }

  export const Alert: React.FC<AlertProps>;
  export const AlertTitle: React.FC<HTMLAttributes<HTMLHeadingElement>>;
  export const AlertDescription: React.FC<HTMLAttributes<HTMLParagraphElement>>;
}

// Toaster Component
declare module '../components/ui/toaster' {
  export const Toaster: React.FC;
}

// Switch Component
declare module '../components/ui/switch' {
  export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
  }

  export const Switch: React.FC<SwitchProps>;
}

// Usage Meter Component
declare module '../components/subscription/usage-meter' {
  export interface UsageMeterProps {
    className?: string;
  }

  export const UsageMeter: React.FC<UsageMeterProps>;
}

declare module './usage-meter' {
  export interface UsageMeterProps {
    className?: string;
  }

  export const UsageMeter: React.FC<UsageMeterProps>;
}

// Date-fns library
declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
  export function parse(dateString: string, formatString: string, baseDate: Date, options?: any): Date;
  export function addDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function addMinutes(date: Date | number, amount: number): Date;
  export function parseISO(date: string): Date;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
  export function formatDuration(duration: Duration, options?: any): string;
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function differenceInMinutes(dateLeft: Date | number, dateRight: Date | number): number;
  
  export interface Duration {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  }
}

// Lucide-react icons
declare module 'lucide-react' {
  import { SVGProps, ComponentType } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
  }

  export type Icon = ComponentType<IconProps>;

  // All used icons in the app
  export const Airplane: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const ArrowRight: Icon;
  export const Bell: Icon;
  export const BellOff: Icon;
  export const Bookmark: Icon;
  export const Briefcase: Icon;
  export const CalendarClock: Icon;
  export const Calendar: Icon;
  export const Car: Icon;
  export const Check: Icon;
  export const CheckCircle2: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const Circle: Icon;
  export const Clock: Icon;
  export const Coffee: Icon;
  export const CreditCard: Icon;
  export const DollarSign: Icon;
  export const ExternalLink: Icon;
  export const Filter: Icon;
  export const Globe: Icon;
  export const Home: Icon;
  export const Hotel: Icon;
  export const Info: Icon;
  export const Languages: Icon;
  export const Loader2: Icon;
  export const Lock: Icon;
  export const LogOut: Icon;
  export const Mail: Icon;
  export const Map: Icon;
  export const MapPin: Icon;
  export const Menu: Icon;
  export const Mic: Icon;
  export const MicOff: Icon;
  export const MinusCircle: Icon;
  export const Monitor: Icon;
  export const Moon: Icon;
  export const Phone: Icon;
  export const Plus: Icon;
  export const PlusCircle: Icon;
  export const RefreshCw: Icon;
  export const RotateCcw: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Settings: Icon;
  export const ShieldCheck: Icon;
  export const Smartphone: Icon;
  export const Sun: Icon;
  export const Ticket: Icon;
  export const Trash2: Icon;
  export const Upload: Icon;
  export const User: Icon;
  export const UserPlus: Icon;
  export const Utensils: Icon;
  export const Wifi: Icon;
  export const X: Icon;
}

// TanStack React Virtual
declare module '@tanstack/react-virtual' {
  export function useVirtualizer<T = any>(options: any): any;
}

// Stripe JS
declare module '@stripe/stripe-js' {
  export function loadStripe(publishableKey: string, options?: any): Promise<any>;
  export interface Stripe {
    redirectToCheckout(options: any): Promise<any>;
  }
}

// Clsx and Tailwind Merge
declare module 'clsx' {
  export default function clsx(...args: any[]): string;
}

declare module 'tailwind-merge' {
  export function twMerge(...args: string[]): string;
}

// Radix UI components
declare module '@radix-ui/react-accordion' {
  export const Root: React.FC<any>;
  export const Item: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
}

declare module '@radix-ui/react-checkbox' {
  export const Root: React.FC<any>;
  export const Indicator: React.FC<any>;
}

declare module '@radix-ui/react-label' {
  export const Root: React.FC<any>;
}

declare module '@radix-ui/react-progress' {
  export const Root: React.FC<any>;
  export const Indicator: React.FC<any>;
}

declare module '@radix-ui/react-radio-group' {
  export const Root: React.FC<any>;
  export const Item: React.FC<any>;
  export const Indicator: React.FC<any>;
}

declare module '@radix-ui/react-scroll-area' {
  export const Root: React.FC<any>;
  export const Viewport: React.FC<any>;
  export const Scrollbar: React.FC<any>;
  export const Thumb: React.FC<any>;
  export const Corner: React.FC<any>;
}

declare module '@radix-ui/react-separator' {
  export const Root: React.FC<any>;
}

declare module '@radix-ui/react-tabs' {
  export const Root: React.FC<any>;
  export const List: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
}

declare module '@radix-ui/react-tooltip' {
  export const Provider: React.FC<any>;
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
  export const Arrow: React.FC<any>;
}