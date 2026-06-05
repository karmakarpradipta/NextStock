import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="light" storageKey="nextstock-theme">
        <BreadcrumbProvider>
          <RouterProvider router={router} />
        </BreadcrumbProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: '12px',
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
