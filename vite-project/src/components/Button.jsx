export default function Button({ onSelectOption, btnImgSrc, caption,width}) {
  return (
    <button onClick={onSelectOption}>
      <img src={btnImgSrc} width={width} alt={`${caption} logo`} />
      <p>{caption}</p>
    </button>
  );
}
