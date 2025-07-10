import "./App.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

function App() {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow overflow-auto">
          <div className="max-w-10/12 mx-auto pt-7">
            <h1>Home Page</h1>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;
