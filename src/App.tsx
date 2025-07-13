import "./App.css";

function App() {
  return (
    <>
      <div className="sm:w-10/12 lg:w-6/12 mx-auto py-7 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-2xl p-4">
          <div className="flex-1 flex flex-col-reverse justify-end space-y-reverse space-y-4 overflow-y-auto">
            <div className="bg-bubble-bot text-brand-primary p-3 rounded max-w-xs">
              Latest message (always at bottom)
            </div>
            <div className="bg-gray-700 text-white p-3 rounded max-w-xs">
              Bot response
            </div>
            <div className="bg-bubble-user text-brand-primary p-3 rounded max-w-xs self-end">
              User message
            </div>
            <div className="bg-gray-700 text-white p-3 rounded max-w-xs">
              Old message 1
            </div>
          </div>

          <div className="pt-4">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
