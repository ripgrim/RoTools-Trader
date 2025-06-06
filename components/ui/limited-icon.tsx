export function LimitedIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 13 16" 
      className={className}
      aria-hidden="true"
    >
      <g>
        <path fill="currentColor" d="M11.2,11.5c-.4.4-.8.8-1.1,1.3.5.2,1,.6,1.4,1h0c.1.1.2.2.4.2.3,0,.5-.2.5-.5,0-.1-.1-.3-.2-.4-.4-.6-.7-1.1-1-1.6Z"/>
        <path fill="currentColor" d="M11.2,4.5c.3-.5.6-1.1,1-1.5.1-.1.2-.2.2-.4,0-.3-.2-.5-.5-.5-.1,0-.3.1-.4.2h0c-.4.4-.9.7-1.4.9.3.5.7,1,1.1,1.3Z"/>
        <path fill="currentColor" d="M1.8,4.5c.4-.4.8-.8,1.1-1.3-.5-.2-1-.5-1.4-.9h0c-.1-.1-.2-.2-.4-.2-.3,0-.5.2-.5.5,0,.1.1.3.2.4.4.5.7,1,1,1.5Z"/>
        <path fill="currentColor" d="M1.8,11.5c-.3.5-.6,1.1-1,1.5-.1.1-.2.2-.2.4,0,.3.2.5.5.5.1,0,.3-.1.4-.2h0c.4-.4.9-.7,1.4-.9-.3-.5-.7-1-1.1-1.3Z"/>
        <path fill="currentColor" d="M12.5,7.5c-2.7,0-5.5-4-5.5-7,0-.3-.2-.5-.5-.5s-.5.2-.5.5c0,3-2.8,7-5.5,7-.3,0-.5.2-.5.5s.2.5.5.5c2.7,0,5.5,4,5.5,7,0,.3.2.5.5.5s.5-.2.5-.5c0-3,2.8-7,5.5-7,.3,0,.5-.2.5-.5s-.2-.5-.5-.5Z"/>
      </g>
    </svg>
  );
} 