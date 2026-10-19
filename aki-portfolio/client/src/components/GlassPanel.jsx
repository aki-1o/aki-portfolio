export default function GlassPanel({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`glass3d ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
