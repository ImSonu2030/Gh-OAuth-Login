export default function UserInfo({link,imgUrl,name}) {
  return (
    <div>
      <a href={link}>
        <img src={imgUrl} alt="User Profile" width="50%" />
      </a>
      <h2>{`Welcome, ${name}`}</h2>
    </div>
  );
}
