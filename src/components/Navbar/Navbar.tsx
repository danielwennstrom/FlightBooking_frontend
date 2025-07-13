import logo from "../../assets/logo.png";

function Navbar() {
  return (
    <nav className="text-brand-primary font-bold bg-white px-5">
      <div className="sm:flex space-x-6 items-center my-3">
        <img src={logo} width={128} />
      </div>
    </nav>
  );
}

export default Navbar;
