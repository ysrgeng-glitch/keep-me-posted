// Region tag pill — SA / VIC / NSW / TAS / National / Global

export default function RegionTag({ region }) {
  if (!region) return null
  return <span className={`region-tag region-tag--${region}`}>{region}</span>
}
