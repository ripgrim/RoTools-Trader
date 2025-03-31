import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 158 220"
      className={cn("h-4 w-4", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="fill-current"
        fillRule="evenodd"
       d="M0,0l133.53,74.27-72,48.34c24.74,23.86,49.58,48.65,74.46,74.39,7.42,7.68,14.75,15.34,22,23-10.01-4.99-20.01-9.99-30-15-32.4-16.24-64.74-32.59-97.03-49.04l-.93,34.31-30.03-.05v-69.23c21.66-12,43.33-24,64.99-36-11.33-5.67-22.67-11.33-34-17-10.33,6-20.67,12-31,18V0Z"
      />
    </svg>
  );
} 