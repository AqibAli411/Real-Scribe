function Link({ className = "", href = "#",children }) {
  return (
    <li>
      <a className={className} href={href}>
        {children}
      </a>
    </li>
  );
}

export default Link;
