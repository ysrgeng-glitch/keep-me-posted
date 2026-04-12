// Category classification badge

export default function CategoryBadge({ category }) {
  if (!category) return null
  return <span className="category-badge">{category}</span>
}
