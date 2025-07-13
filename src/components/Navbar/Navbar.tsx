import logo from "../../assets/logo.png";

function Navbar() {
  return (
    <nav className="text-brand-primary font-bold bg-white px-5 py-2">
      <div className="flex space-x-6 items-center not-xl:justify-center my-3">
        <img src={logo} width={128} />
      </div>
    </nav>
  );
}

export default Navbar;
