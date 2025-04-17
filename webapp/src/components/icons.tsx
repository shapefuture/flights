import { Loader2 } from "lucide-react";
import * as React from "react";

// Google SVG icon
export const Icons = {
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      focusable="false"
      width={props.width || 16}
      height={props.height || 16}
      viewBox="0 0 24 24"
      {...props}
    >
      <g>
        <path
          fill="#4285F4"
          d="M21.805 10.023c0-.637-.057-1.25-.16-1.834H12.19v3.478h5.44c-.234 1.258-.94 2.326-2.003 3.046v2.527h3.24c1.898-1.748 2.988-4.324 2.988-7.217z"
        />
        <path
          fill="#34A853"
          d="M12.19 22c2.704 0 4.97-.873 6.627-2.365l-3.24-2.527c-.9.604-2.055.961-3.387.961-2.603 0-4.807-1.758-5.594-4.118H3.227v2.585A9.993 9.993 0 0012.19 22z"
        />
        <path
          fill="#FBBC05"
          d="M6.596 13.951A5.886 5.886 0 015.866 12c0-.674.115-1.328.319-1.951V7.464H3.227A9.996 9.996 0 002.19 12c0 1.572.379 3.06 1.037 4.382l3.37-2.431z"
        />
        <path
          fill="#EA4335"
          d="M12.19 6.77c1.474 0 2.792.508 3.832 1.507l2.86-2.86C17.156 3.971 14.89 3 12.19 3c-3.482 0-6.48 1.998-7.963 4.893l3.37 2.431c.771-2.36 2.995-4.118 5.593-4.118z"
        />
        <path fill="none" d="M2 2h20v20H2z"/>
      </g>
    </svg>
  ),
  spinner: Loader2,
};