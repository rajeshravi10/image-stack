import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Link,
} from "react-router-dom";
import JobDetailsPOC from "./JobDetailsPOC";
import "./App.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="App">
        <header className="App-header">
          <p>
            Select a job to open <b>Job Details POC</b>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
            <Link
              to="/job-details"
              state={{ jobId: "POC123" }}
              className="App-link"
              style={{ fontSize: "20px" }}
            >
              Open Job POC123
            </Link>

            <Link
              to="/job-details"
              state={{ jobId: "POC999" }}
              className="App-link"
              style={{ fontSize: "20px" }}
            >
              Open Job POC999
            </Link>
          </div>
        </header>
      </div>
    ),
  },
  {
    path: "/job-details",
    element: <JobDetailsPOC onBack={() => window.history.back()} />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
