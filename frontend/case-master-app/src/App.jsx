import { BackgroundContextProvider } from "./context/bg-context";

function App() {
  const { BackgroundContext, background, toggleBg } =
    BackgroundContextProvider();

  // console.log(background);

  let bg_color = " bg-slate-600";

  if (background) {
    bg_color = " bg-slate-100";
  }

  return (
    <BackgroundContext.Provider>
      <button onClick={toggleBg}>CLICK</button>
      <div className={` p-10 w-full min-h-screen ${bg_color} `}>
        <h1 className="text-3xl ">Hello ooo</h1>
      </div>
    </BackgroundContext.Provider>
  );
}

export default App;
