import { SessionProvider, useSession} from "next-auth/react";
import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} /> 
      <ToastContainer position="top-right" autoClose={3000} />
    </SessionProvider>
  );
}
