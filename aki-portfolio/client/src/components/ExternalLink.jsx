// Wrap any real link (http, mailto:, tel:) in this instead of a plain <a>.
// It always opens in a new tab — matches the site-wide "every real link
// opens in a new tab" rule. Internal navigation should use react-router's
// <Link> instead, so it stays same-tab.
export default function ExternalLink({ href, children, className = '', ...rest }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  )
}
