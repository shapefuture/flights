// Type declarations for UI components
declare module '../ui/dialog' {
  import React from 'react';

  export interface DialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  }

  export interface DialogContentProps {
    children?: React.ReactNode;
    className?: string;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
    onFocusOutside?: (event: FocusEvent) => void;
    forceMount?: boolean;
  }

  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: React.FC<{ asChild?: boolean; children?: React.ReactNode }>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogHeader: React.FC<{ className?: string; children?: React.ReactNode }>;
  export const DialogFooter: React.FC<{ className?: string; children?: React.ReactNode }>;
  export const DialogTitle: React.FC<{ className?: string; children?: React.ReactNode }>;
  export const DialogDescription: React.FC<{ className?: string; children?: React.ReactNode }>;
}

declare module '../ui/dropdown-menu' {
  import React from 'react';

  export interface DropdownMenuProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  }

  export interface DropdownMenuTriggerProps {
    children?: React.ReactNode;
    asChild?: boolean;
  }

  export interface DropdownMenuContentProps {
    className?: string;
    children?: React.ReactNode;
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    alignOffset?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    forceMount?: boolean;
  }

  export interface DropdownMenuItemProps {
    className?: string;
    children?: React.ReactNode;
    onSelect?: () => void;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
  }

  export const DropdownMenu: React.FC<DropdownMenuProps>;
  export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps>;
  export const DropdownMenuContent: React.FC<DropdownMenuContentProps>;
  export const DropdownMenuLabel: React.FC<{ className?: string; children?: React.ReactNode }>;
  export const DropdownMenuSeparator: React.FC<{ className?: string }>;
  export const DropdownMenuItem: React.FC<DropdownMenuItemProps>;
  export const DropdownMenuGroup: React.FC<{ children?: React.ReactNode }>;
}

declare module '../ui/avatar' {
  import React from 'react';

  export interface AvatarProps {
    className?: string;
    children?: React.ReactNode;
  }

  export interface AvatarImageProps {
    className?: string;
    src?: string;
    alt?: string;
  }

  export interface AvatarFallbackProps {
    className?: string;
    children?: React.ReactNode;
    delayMs?: number;
  }

  export const Avatar: React.FC<AvatarProps>;
  export const AvatarImage: React.FC<AvatarImageProps>;
  export const AvatarFallback: React.FC<AvatarFallbackProps>;
}

declare module '../ui/button' {
  import React from 'react';

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    disabled?: boolean;
  }

  export const Button: React.FC<ButtonProps>;
}

declare module 'date-fns' {
  export function parse(date: string | Date, format: string, referenceDate: Date): Date;
  export function format(date: Date | number, format: string, options?: { locale?: Locale }): string;
  export function addDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isValid(date: any): boolean;
  
  export interface Locale {}
}