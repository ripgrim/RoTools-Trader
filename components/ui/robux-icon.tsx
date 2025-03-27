import { cn } from "@/lib/utils";

interface RobuxIconProps {
  className?: string;
}

export function RobuxIcon({ className }: RobuxIconProps) {
  return (
    <svg 
      viewBox="0 0 14 15.35" 
      className={cn("h-4 w-4", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="fill-current"
        fillRule="evenodd"
        d="M12.6,2.77c.9.5,1.4,1.5,1.4,2.5v4.8c0,1-.5,2-1.4,2.5l-4.1,2.4c-.9.5-2,.5-2.9,0l-4.1-2.4c-1-.5-1.5-1.5-1.5-2.5v-4.8c0-1,.6-2,1.4-2.5L5.5.38c.9-.5,2-.5,2.9,0l4.2,2.4ZM6,1.27L2,3.67c-.6.3-1,1-1,1.6v4.7c0,.7.4,1.4,1,1.7l4,2.4c.6.3,1.3.3,1.9,0l4.1-2.4c.6-.3,1-1,1-1.7v-4.7c0-.6-.4-1.3-1-1.6l-4-2.4c-.6-.3-1.4-.3-2,0h0ZM8,2.47l3,1.7c.6.4,1,1.1,1,1.8v3.3c0,.8-.4,1.4-1,1.8l-3,1.8c-.6.4-1.4.4-2.1,0l-2.9-1.7c-.6-.4-1-1.1-1-1.8v-3.4c0-.7.4-1.4,1-1.8l3-1.7c.6-.3,1.4-.3,2,0h0ZM5,9.67h4v-4h-4v4Z"
      />
    </svg>
  );
} 