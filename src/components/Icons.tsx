import type { SVGProps } from 'react'

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" {...props}>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path d="M20 20l-3-3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" {...props}>
      <path
        d="M6 6h15l-2 9H8L6 6z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" {...props}>
      <path
        d="M12 22a2 2 0 002-2H10a2 2 0 002 2zM18 16v-5a6 6 0 10-12 0v5l-2 2h16l-2-2z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconRobot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" {...props}>
      <rect x="5" y="7" width="14" height="12" rx="2" strokeWidth="2" />
      <path d="M9 7V5h6v2" strokeWidth="2" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="13" r="1" fill="currentColor" />
      <path d="M9 17h6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
