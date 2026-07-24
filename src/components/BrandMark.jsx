export default function BrandMark({ className = '' }) {
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}icons/app-icon.svg`}
      alt=""
      aria-hidden="true"
    />
  );
}
