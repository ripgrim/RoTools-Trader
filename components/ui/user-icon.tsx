export function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%232A2A2A'/%3E%3Cpath d='M75,40 C87,40 97,50 97,62 C97,74 87,84 75,84 C63,84 53,74 53,62 C53,50 63,40 75,40 Z M75,94 C98,94 116,105 116,120 L116,125 L34,125 L34,120 C34,105 52,94 75,94 Z' fill='%23666666'/%3E%3C/svg%3E" alt="Limited Icon" className={className} />
    );
  } 